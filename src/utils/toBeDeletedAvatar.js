const toBeDeletedAvatar = (avatarLocalPath) => {
  fs.unlink(avatarLocalPath, (err) => {
    if (err) console.log(err);
  });
};

export { toBeDeletedAvatar };
