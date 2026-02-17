import { cn } from "@/lib/utils";

type MainProps = React.HTMLAttributes<HTMLElement> & {
  ref?: React.Ref<HTMLElement>;
};

export function Main({ className, ...props }: MainProps) {
  return (
    <div className="flex flex-1 flex-col">
      <main className={cn("@container/main flex flex-1 flex-col gap-2", className)} {...props} />
    </div>
  );
}
