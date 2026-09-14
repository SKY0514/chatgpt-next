import React from "react";
import { Button } from "../ui/button";
import { ButtonProps } from "@base-ui/react";

const Submit = ({ children, ...other }: ButtonProps) => {
  return (
    <Button type="submit" {...other}>
      {children}
    </Button>
  );
};

export default Submit;
