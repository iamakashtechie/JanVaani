/**
 * Reusable skeleton loading card — mimics an issue card shape.
 */
export const SkeletonCard = () => (
    <div className="animate-pulse bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-3">
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-5 bg-gray-200 rounded-full w-20" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-16" />
            <div className="h-8 bg-gray-200 rounded w-16" />
        </div>
    </div>
);

/**
 * Full-page skeleton for initial load states.
 */
export const SkeletonPage = ({ count = 4 }) => (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
);

/**
 * Inline skeleton for small loading states.
 */
export const SkeletonLine = ({ width = 'w-full', height = 'h-4' }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${width} ${height}`} />
);
