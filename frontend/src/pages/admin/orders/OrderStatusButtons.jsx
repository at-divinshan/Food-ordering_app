import { statuses, transitions } from "../../../services/orderService";

export default function OrderStatusButtons({
  status,
  busy,
  onUpdate,
  orderId,
}) {
  return (
    <div
      className="status-actions order-status-options"
      role="group"
      aria-label={`Order ${orderId} status`}
    >
      {statuses.map((option) => {
        const current = option === status;
        const allowed = (transitions[status] || []).includes(option);
        return (
          <button
            type="button"
            key={option}
            className={`order-status-button order-status-${option.toLowerCase().replaceAll(" ", "-")}`}
            aria-pressed={current}
            disabled={busy || current || !allowed}
            title={
              current
                ? "Current status"
                : !allowed
                  ? `Cannot change ${status} to ${option}`
                  : `Mark ${option}`
            }
            onClick={() => onUpdate(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
