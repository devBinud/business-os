import { useMemo } from 'react';
import { useStore } from './DemoStore.jsx';
import { MODULES, MODULE_BY_ID } from '../data/modules.js';
import {
  canEdit, canView, canSeeFinancials, canApproveExpenses, seesOnlyOwnTasks,
} from '../utils/permissions.js';

/** Combines the role's permissions with the business's module visibility settings. */
export function useAccess() {
  const { role, business, currentUser } = useStore();

  return useMemo(() => {
    const enabled = (id) => MODULE_BY_ID[id]?.core || business.enabledModules.includes(id);
    const view = (id) => enabled(id) && canView(role, id);
    return {
      role,
      userId: currentUser?.id,
      enabled,
      canView: view,
      canEdit: (id) => view(id) && canEdit(role, id),
      financials: canSeeFinancials(role),
      approveExpenses: canApproveExpenses(role),
      ownTasksOnly: seesOnlyOwnTasks(role),
      navModules: MODULES.filter((m) => view(m.id)),
    };
  }, [role, business.enabledModules, currentUser?.id]);
}
