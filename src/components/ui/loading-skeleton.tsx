import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "text" | "circle" | "button"
  width?: string | number
  height?: string | number
}

function Skeleton({
  className,
  variant = "default",
  width,
  height,
  ...props
}: SkeletonProps) {
  const baseStyles = "animate-pulse bg-gray-200 dark:bg-gray-800 rounded"
  
  const variants = {
    default: "h-4 w-full",
    card: "h-32 w-full rounded-lg",
    text: "h-4 w-3/4",
    circle: "h-10 w-10 rounded-full",
    button: "h-10 w-24 rounded-md",
  }

  const style = {
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
  }

  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      style={style}
      {...props}
    />
  )
}

interface PlanCardSkeletonProps {
  count?: number
}

function PlanCardSkeleton({ count = 3 }: PlanCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-900 shadow-sm"
        >
          {/* Popular badge skeleton */}
          {index === 1 && (
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <Skeleton className="h-6 w-20 rounded-full bg-orange-200 dark:bg-orange-800" />
            </div>
          )}
          
          {/* Plan name */}
          <div className="text-center mb-4">
            <Skeleton className="h-6 w-24 mx-auto mb-2" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
          
          {/* Price */}
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          
          {/* Features list */}
          <div className="space-y-3 mb-6">
            {Array.from({ length: 4 }).map((_, featureIndex) => (
              <div key={featureIndex} className="flex items-center gap-3">
                <Skeleton variant="circle" className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
          
          {/* CTA button */}
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      ))}
    </div>
  )
}

interface PaymentFormSkeletonProps {}

function PaymentFormSkeleton({}: PaymentFormSkeletonProps) {
  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <Skeleton className="h-6 w-32 mx-auto mb-2" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
      
      {/* Plan summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <hr className="my-2 border-gray-200 dark:border-gray-600" />
        <div className="flex justify-between items-center font-medium">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
      
      {/* Form fields */}
      <div className="space-y-4 mb-6">
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div>
            <Skeleton className="h-4 w-12 mb-2" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
      
      {/* Submit button */}
      <Skeleton className="h-12 w-full rounded-md" />
      
      {/* Security note */}
      <div className="mt-4 text-center">
        <Skeleton className="h-3 w-40 mx-auto" />
      </div>
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className={cn("animate-spin", sizeClasses[size], className)}>
      <svg
        className="w-full h-full text-gray-300 dark:text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
}

function LoadingButton({
  loading = false,
  loadingText = "Loading...",
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors",
        "bg-orange-600 hover:bg-orange-700 text-white",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <LoadingSpinner size="sm" className="text-white" />
      )}
      <span className={cn(loading && "opacity-70")}>
        {loading ? loadingText : children}
      </span>
    </button>
  )
}

export { 
  Skeleton, 
  PlanCardSkeleton, 
  PaymentFormSkeleton, 
  LoadingSpinner, 
  LoadingButton 
}