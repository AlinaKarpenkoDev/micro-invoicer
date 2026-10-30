export default function ServerDownError() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50/90 backdrop-blur-sm">
          <svg
            className="mb-4 h-12 w-12 animate-spin text-zinc-900"
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
          <h2 className="text-2xl font-bold text-gray-900">
            Перезапускаємо сервер...
          </h2>
          <p className="mt-2 text-gray-500">
            Це може зайняти кілька секунд. Будь ласка, зачекайте.
          </p>
        </div>
  );
}