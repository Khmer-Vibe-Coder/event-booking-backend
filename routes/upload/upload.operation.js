const path = require("path");
const util = require("../../exports/util");

const uploadImage = async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return util.ResFail(req, res, "No file uploaded.");
    }

    const sampleFile = req.files.file;

    const ext = path.extname(sampleFile.name);
    const randomName = util.generateResetToken() + ext;

    const uploadDir = "/public/uploads/";
    const uploadUrl = "/uploads/" + randomName;
    const uploadPath = path.join(__dirname, "..", "..", uploadDir, randomName);

    await sampleFile.mv(uploadPath);

    // Build full public URL
    const fullUrl = `${req.protocol}://${req.get("host")}${uploadUrl}`;

    return util.ResSuss(req, res,  { url: fullUrl }, "Upload Successfully.");

  } catch (error) {
    console.error("upload image route error:", error);
    return util.ResFail(
      req,
      res,
      "An error occurred during upload. Please try again."
    );
  }
};

module.exports = { uploadImage };
