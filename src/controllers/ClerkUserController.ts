import { Request, Response } from "express";
import { clerkClient } from "..";

export const updateClerkUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const userData = req.body;

  try {
    await clerkClient.users.updateUserMetadata(
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
