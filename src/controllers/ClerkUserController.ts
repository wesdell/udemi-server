import { Request, Response } from "express";
import { getAuth } from "@clerk/express";

import { clerkClient } from "..";

export const updateClerkUser = async (req: Request, res: Response): Promise<void> => {
  const auth = getAuth(req);

  if (!auth.userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { userId } = req.params;
  const userData = req.body;

  try {
    const user = await clerkClient.users.updateUserMetadata(
      userId as string,
      {
        publicMetadata: {
          userType: userData.publicMetadata.userType,
          settings: userData.publicMetadata.settings
        }
      }
    );

    res
      .status(200)
      .json({
        message: "User updated successfully",
        data: user
      });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error updating the user",
        error
      })
  }
}
