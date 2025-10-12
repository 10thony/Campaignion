// pages/api/upload.ts (Next.js API route)
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // we will parse multipart with formidable
  },
};

const UPLOADTHING_API_URL = "https://uploadthing.com/api/upload"; // Replace if your UploadThing endpoint differs

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("formidable error", err);
      return res.status(500).json({ error: "Upload parse error" });
    }

    // formidable returns file under files.file (depends on client)
    const file = (files as any).file;
    if (!file) return res.status(400).json({ error: "No file provided" });

    try {
      // Read file contents
      const buffer = fs.readFileSync(file.path);

      // Proxy to UploadThing (Use their required API if different)
      const token = process.env.UPLOADTHING_TOKEN;
      if (!token) {
        console.warn("UPLOADTHING_TOKEN not set");
        // For local dev we can respond with file metadata only
        return res.status(200).json({
          message: "File accepted locally (UPLOADTHING_TOKEN not set)",
          filename: file.name || file.originalFilename || "unknown",
          size: buffer.length,
        });
      }

      const formData = new (require("form-data"))();
      formData.append("file", buffer, { filename: file.name || file.originalFilename || "upload.pdf" });

      const resp = await fetch(UPLOADTHING_API_URL, {
        method: "POST",
        body: formData as any,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resp.ok) {
        const txt = await resp.text();
        console.error("UploadThing error", resp.status, txt);
        return res.status(500).json({ error: "UploadThing error", details: txt });
      }

      const json = await resp.json();
      // json shape depends on UploadThing; just forward it
      return res.status(200).json({ uploadThingResponse: json });
    } catch (e: any) {
      console.error("upload proxy error", e);
      return res.status(500).json({ error: String(e?.message ?? e) });
    }
  });
}