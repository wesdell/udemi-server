import { Request, Response } from "express";
import { Course } from "../models";

export const GetCourses = async (req: Request, res: Response): Promise<void> => {
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

export const GetCourse = async (req: Request, res: Response): Promise<void> => {
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
