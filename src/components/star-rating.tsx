"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  totalStars?: number;
  labels?: { [key: number]: string };
}

const defaultRatingLabels: { [key: number]: string } = {
    1: "Sangat Buruk",
    2: "Buruk",
    3: "Cukup",
    4: "Baik",
    5: "Sangat Baik",
};

export function StarRating({ value, onChange, totalStars = 5, labels = defaultRatingLabels }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-1">
        {[...Array(totalStars)].map((_, index) => {
            const starValue = index + 1;
            return (
            <button
                type="button"
                key={starValue}
                onClick={() => onChange(starValue)}
                onMouseEnter={() => setHoverValue(starValue)}
                onMouseLeave={() => setHoverValue(0)}
                className="p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={`Rate ${starValue} out of ${totalStars}`}
            >
                <Star
                className={cn(
                    "h-8 w-8 transition-all duration-200",
                    (hoverValue || value) >= starValue
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-muted-foreground/30"
                )}
                />
            </button>
            );
        })}
        </div>
        {value > 0 && (
            <p className="text-sm text-muted-foreground mt-2 sm:mt-0 font-medium bg-secondary px-3 py-1 rounded-full">
                {labels[value]}
            </p>
        )}
    </div>
  );
}

    