import express from 'express';

import { getCourse, getCourses } from '../controllers/CourseController';

const router = express.Router();

router.get("/", getCourses);
router.get("/:courseId", getCourse);


export default router;
