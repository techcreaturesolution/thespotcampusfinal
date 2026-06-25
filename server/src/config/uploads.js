import express from "express";
import path from "path";

export const setupUploads = (app, __dirname) => {
  app.use("/uploads", express.static(path.resolve(__dirname, "./uploads"), {
    dotfiles: 'deny', // Deny access to dotfiles
    index: false, // Don't serve directory indexes
    maxAge: '1d', // Cache for 1 day
    setHeaders: (res, filePath, stat) => {
      // Security headers for file downloads
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      });
      
      // Set appropriate Content-Type for different file types
      const ext = filePath.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        res.set('Content-Type', `image/${ext === 'jpg' ? 'jpeg' : ext}`);
      } else if (ext === 'pdf') {
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', 'inline'); // Display in browser instead of download
      } else if (['doc', 'docx'].includes(ext)) {
        res.set('Content-Disposition', 'attachment'); // Force download for office docs
      }
    }
  }));
};
