import { CheckCircle2 } from "lucide-react";

export default function FeatureItem({ feature }) {
  return (
    <div className="flex gap-4">

      <div className="mt-1 flex-shrink-0">
        <CheckCircle2
          className="text-cyan-500"
          size={28}
        />
      </div>

      <div>

        <h3 className="text-xl font-semibold text-slate-900">
          {feature.title}
        </h3>

        <p className="mt-2 text-gray-600 leading-7">
          {feature.description}
        </p>

      </div>

    </div>
  );
}