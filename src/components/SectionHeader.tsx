import React from 'react';

interface Props {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  children?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, icon, color = 'text-gold', children }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
      <div className="flex items-start gap-4 min-w-[200px] flex-1">
        {icon && (
          <div className={`${color} mt-1`}>
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg md:text-xl font-title text-parchment tracking-wider uppercase">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-parchment-dim mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div className="shrink-0 mt-1">
          {children}
        </div>
      )}
    </div>
  )
}
