export default function LoadingSpinner({ text = "Завантаження..." }: { text?: string }) {
  return (
     <div className="flex h-40 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <svg
                  className="h-6 w-6 animate-spin text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-sm font-medium">
                  {text}
                </span>
              </div>
            </div>
  );
}