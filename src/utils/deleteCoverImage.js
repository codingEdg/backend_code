import fs from "fs";
const deleteCoverImage = (path) => {
  fs.unlink(path, (err) => err && console.log(err));
};

export { deleteCoverImage };
