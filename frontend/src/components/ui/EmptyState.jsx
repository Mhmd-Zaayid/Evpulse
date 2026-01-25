const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-secondary-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-secondary-900 mb-2">{title}</h3>
      {description && (
        <p className="text-secondary-500 max-w-md mb-6">{description}</p>
      )}
      {action}
    </div>
  );
};

export default EmptyState;
