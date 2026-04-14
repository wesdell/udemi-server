import express from 'express';
import multer from "multer";

import {
  createCourse,
  deleteCourse,
  getCourse, getCourses,
  getUploadVideoUrl,
  updateCourse
} from '../controllers/CourseController';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", getCourses);
router.get("/:courseId", getCourse);

router.post("/", createCourse);
router.post("/:courseId/sections/:sectionId/chapters/:chapterId/get-upload-url", getUploadVideoUrl);

router.put("/:courseId", upload.single("image"), updateCourse);

router.delete("/:courseId", deleteCourse)


export default router;
