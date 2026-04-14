import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuth } from "@clerk/express";

import { Course } from "../models";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

export const getCourses = async (req: Request, res: Response): Promise<void> => {
  const { category } = req.query;

  try {
    const courses = category && category !== "all"
      ? await Course.scan("category").eq(category).exec()
      : await Course.scan().exec();

    res
      .status(200)
      .json({
        message: "Courses retrieve successfully",
        data: courses
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving courses", error });
  }
};

export const getCourse = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;

  try {
    const course = await Course.get(courseId as string);
    if (!course) {
      res
        .status(404)
        .json({
          message: `Course with id: ${courseId} does not exist`,
        })
      return;
    }

    res
      .status(200)
      .json({
        message: "Course retrieve successfully",
        data: course
      });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error retrieving the course",
        error
      })
  }
}

export const createCourse = async (req: Request, res: Response): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { teacherId, teacherName } = req.body;
  if (!teacherId || !teacherName) {
    res
      .status(400)
      .json({
        message: "Teacher id and name is required"
      })
    return;
  }

  try {
    const newCourse = new Course({
      courseId: uuidv4(),
      teacherId,
      teacherName,
      title: "Untitled course",
      description: "",
      category: "Uncategorized",
      image: "",
      price: 0,
      level: "Beginner",
      status: "Draft",
      sections: [],
      enrrollments: []
    });
    await newCourse.save();

    res
      .status(201)
      .json({
        message: "Course created successfully",
        data: newCourse
      });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error creating course",
        error
      })
  }
}

export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const updatedCourse = { ...req.body };

  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const course = await Course.get(courseId as string);
    if (!course) {
      res
        .status(404)
        .json({
          message: `Course with id: ${courseId} does not exist`,
        })
      return;
    }

    if (course.teacherId !== userId) {
      res
        .status(403)
        .json({
          message: "Not authorized to update a course",
        })
      return;
    }

    if (updatedCourse.price && isNaN(parseInt(updatedCourse.price))) {
      res
        .status(400)
        .json({
          message: "Invalid price format",
          error: "Price must be a valid number"
        })
      return;
    }
    updatedCourse.price = parseInt(updatedCourse.price) * 100;

    if (updatedCourse.sections) {
      const sections = typeof updatedCourse.sections === "string"
        ? JSON.parse(updatedCourse.sections)
        : updatedCourse.sections;

      updatedCourse.sections = sections.map((section: any) => ({
        ...section,
        sectionId: section.sectionId || uuidv4(),
        chapters: section.chapters.map((chapter: any) => ({
          ...chapter,
          chapter: chapter.chapterId || uuidv4()
        }))
      }));
    }

    Object.assign(course, updatedCourse);
    await course.save();

    res
      .status(200)
      .json({
        message: "Course updated successfully",
        data: course
      });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error updating course",
        error
      })
  }
}

export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { courseId } = req.params;
  try {
    const course = await Course.get(courseId as string);
    if (!course) {
      res
        .status(404)
        .json({
          message: `Course with id: ${courseId} does not exist`,
        })
      return;
    }

    if (course.teacherId !== userId) {
      res
        .status(403)
        .json({
          message: "Not authorized to delete a course",
        })
      return;
    }

    await Course.delete(courseId as string);

    res
      .status(204)
      .json({ message: "Course deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error deleting course",
        error
      });
  }
};

export const getUploadVideoUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res
      .status(401)
      .json({ message: "Unauthorized" });
    return;
  }

  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    res
      .status(400)
      .json({ message: "File name and type are required" });
    return;
  }

  try {
    const uniqueId = uuidv4();
    const s3Key = `videos/${uniqueId}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || "",
      Key: s3Key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    const videoUrl = `${process.env.CLOUDFRONT_DOMAIN}/videos/${uniqueId}/${fileName}`;

    res
      .status(201)
      .json({
        message: "Upload URL generated successfully",
        data: { uploadUrl, videoUrl },
      });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error generating upload URL",
        error
      });
  }
};