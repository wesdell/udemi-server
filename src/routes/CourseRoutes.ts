import express from 'express';

import { GetCourse, GetCourses } from '../controllers/CourseController';

const router = express.Router();

router.get("/", GetCourses);
router.get("/:courseId", GetCourse);


export default router;
