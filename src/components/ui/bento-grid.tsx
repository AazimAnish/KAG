import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ",
        className
      )}
    >
      {children}
    </div>
  );
};

interface BentoGridItemProps {
  title: string;
  description: string;
  header: React.ReactNode;
  icon: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export const BentoGridItem = ({
  title,
  description,
  header,
  icon,
  className,
  titleClassName,
  descriptionClassName,
}: BentoGridItemProps) => {
  return (
    <div
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 p-4",
        "bg-[#EFDCAB]/10 dark:bg-[#443627]/50 backdrop-blur-lg",
        "border border-[#D98324]/20",
        "justify-between flex flex-col space-y-4",
        className
      )}
    >
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {header}
      </div>
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        <div className="flex items-center gap-2">
          {icon}
          <div className={cn("font-semibold tracking-wide", titleClassName)}>{title}</div>
        </div>
        <div className={cn("mt-2 text-sm", descriptionClassName)}>{description}</div>
      </div>
    </div>
  );
};
