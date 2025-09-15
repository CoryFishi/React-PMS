import { FaExclamationTriangle } from "react-icons/fa";

export default function NotFound() {
  return (
    <section className="text-center flex flex-col justify-center items-center h-96">
      <FaExclamationTriangle className="fas fa-exclamation-triangle text-yellow-400 fa-4x mb-4" />
      <h1 className="text-6xl font-bold mb-4">404 Not Found</h1>
      <p className="text-xl mb-5">This page does not exist</p>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => window.history.back()}
      >
        Go Back
      </button>
    </section>
  );
}
