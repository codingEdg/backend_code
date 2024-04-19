import fs from "fs";

const toBeDeletedAvatar = (avatarLocalPath) => {
  try {
    fs.unlink(avatarLocalPath, (err) => {
      if (err) console.log(err);
    });
  } catch (err) {
    console.log("error while deleting local path");
    console.log(err);
  }
};

export { toBeDeletedAvatar };
