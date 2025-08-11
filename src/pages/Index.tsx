import React from "react";
import Catalog from "./Catalog";

const Index = () => {
  return (
    <div className="min-h-screen">
      <iframe
        src="/landing.html"
        title="Invertase Landing"
        className="w-full h-screen"
        style={{ border: "0" }}
      />
      <Catalog />
    </div>
  );
};

export default Index;
