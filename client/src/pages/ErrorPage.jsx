import React from "react";
import { Link, useRouteError } from "react-router-dom";

const ErrorPage = () => {
  const error = useRouteError();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">{error?.status || "Error"}</h1>
        <p className="text-xl text-gray-600 mb-8">{error?.statusText || "Something went wrong"}</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );
};

export default ErrorPage;
