import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 cursor-pointer"
      >
        <span className="font-medium text-gray-800">{title}</span>
        <ChevronDown
          className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          size={16}
        />
      </button>
      {open && <div className="border-t border-gray-100 p-4">{children}</div>}
    </div>
  );
}

export default Accordion;
