import {
  Cog,
  Cpu,
  PenTool,
  FileCode,
  Waves,
  BrainCircuit,
  Boxes,
  Box,
} from "lucide-react";

export const technologies = [
  {
    id: 1,
    name: "ANSYS",
    Icon: Cog,
    position: "top",
    delay: 0.0,
  },

  {
    id: 2,
    name: "MATLAB",
    Icon: PenTool,
    position: "topLeft",
    delay: 0.2,
  },

  {
    id: 3,
    name: "SolidWorks",
    Icon: Cpu,
    position: "topRight",
    delay: 0.4,
  },

  {
    id: 4,
    name: "Python",
    Icon: FileCode,
    position: "left",
    delay: 0.6,
  },

  {
    id: 5,
    name: "CFD",
    Icon: Waves,
    position: "right",
    delay: 0.8,
  },

  {
    id: 6,
    name: "AI",
    Icon: BrainCircuit,
    position: "bottomLeft",
    delay: 1.0,
  },

  {
    id: 7,
    name: "FEA",
    Icon: Boxes,
    position: "bottomRight",
    delay: 1.2,
  },

  {
    id: 8,
    name: "CAD",
    Icon: Box,
    position: "bottom",
    delay: 1.4,
  },
];