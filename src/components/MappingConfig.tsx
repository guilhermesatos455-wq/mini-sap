import React from 'react';
import { MovementColumnMapping } from '../types/audit';

interface Props {
  mapping: MovementColumnMapping;
  onChange: (mapping: MovementColumnMapping) => void;
  title: string;
}

const MappingConfig: React.FC<Props> = ({ mapping, onChange, title }) => {
  const fields = Object.keys(mapping) as (keyof MovementColumnMapping)[];

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-sm tracking-widest uppercase">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {fields.map(field => (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 uppercase">{field}</label>
            <input
              type="number"
              value={mapping[field] ?? ''}
              onChange={(e) => onChange({ ...mapping, [field]: parseInt(e.target.value) })}
              className="px-3 py-2 rounded-lg border text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MappingConfig;
