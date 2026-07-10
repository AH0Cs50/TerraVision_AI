import { History, ListChecks } from "lucide-react";
import { useState } from "react";

const ActiveTasks = ({ tasks }) => {
  const [checked, setChecked] = useState(tasks.map(() => true));

  const toggleTask = (index) => {
    setChecked((prev) => prev.map((val, i) => (i === index ? !val : val)));
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      {/* Department Title*/}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gray-400">
          <ListChecks className="text-[#2D6A4F]" />
        </span>
        <h2 className="text-gray-800 font-semibold text-sm">Active Tasks</h2>
      </div>

      {/* Task list*/}
      <div className="flex flex-col gap-3">
        {tasks.map((task, index) => (
          <div
            key={index}
            className="flex items-start gap-3 cursor-pointer"
            onClick={() => toggleTask(index)}
          >
            {/* Check square */}
            <div
              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                checked[index] ? "bg-green-600" : "border-2 border-gray-300"
              }`}
            >
              {checked[index] && <span className="text-white text-xs">✓</span>}
            </div>

            {/*   Check square */}
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm">
              {task.icon}
            </div>

            {/* Task text*/}
            <div>
              <p className="text-gray-800 text-sm font-medium">{task.title}</p>
              <p className="text-gray-500 text-xs">{task.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/*  Task History button  */}
      <button className="flex items-center gap-2 text-green-700 text-xs mt-4 font-medium ">
        <span>
          <History className="text-[#2D6A4F]" />
        </span>{" "}
        VIEW TASKS HISTORY
      </button>
    </div>
  );
};

export default ActiveTasks;
