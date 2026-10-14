import { logoutAction } from '../actions/logout.action';

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="min-h-11 rounded-xl px-3 text-sm font-semibold text-ink-muted hover:bg-surface-raised hover:text-ink"
      >
        Salir
      </button>
    </form>
  );
}
