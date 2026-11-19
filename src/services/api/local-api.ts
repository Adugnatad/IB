import { ADMIN_ASSIGNABLE_ROLES } from "@/features/users-management/adminRoleOptions";
import { createLocalTokenPair } from "@/lib/auth/local-token";
import type { AdminUser } from "@/types/admin";
import type {
  Contract,
  ContractApprovalRule,
  ContractStatus,
  ContractUser,
  ContractUserPermissionType,
  SignatoryGroup,
  SignatoryGroupMember,
} from "@/types/contracts";
import { CONTRACT_USER_PERMISSION_TYPES } from "@/types/contracts";
import type { AuthUser } from "./auth-api";

const STORAGE_KEY = "internet-banking-local-demo-v1";
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

interface LocalState {
  contracts: Contract[];
  users: AdminUser[];
  groups: Record<string, SignatoryGroup[]>;
  approvalRules: Record<string, ContractApprovalRule[]>;
}

function makeContract(
  id: string,
  customerId: string,
  contractName: string,
  status: ContractStatus,
  effectiveDate: string,
  expiryDate: string,
): Contract {
  return {
    id,
    customerId,
    contractName,
    description: "Sample local demo contract",
    status,
    createdByUserId: DEMO_USER_ID,
    effectiveDate,
    expiryDate,
    createdDate: effectiveDate,
    lastModifiedDate: effectiveDate,
    accountIds: [],
    users: [],
    activeUserCount: 0,
    accountCount: 0,
    active: status === "ACTIVE",
    deleted: false,
    operational: status === "ACTIVE",
  };
}

function createInitialState(): LocalState {
  const contracts = [
    makeContract(
      "demo-contract-001",
      "demo-customer-001",
      "Aster Trading",
      "ACTIVE",
      "2025-01-01T00:00:00.000Z",
      "2027-01-01T00:00:00.000Z",
    ),
    makeContract(
      "demo-contract-002",
      "demo-customer-002",
      "Abay Logistics",
      "PENDING",
      "2025-03-01T00:00:00.000Z",
      "2027-03-01T00:00:00.000Z",
    ),
    makeContract(
      "demo-contract-003",
      "demo-customer-003",
      "Biftu Cooperative",
      "SUSPENDED",
      "2024-05-01T00:00:00.000Z",
      "2026-05-01T00:00:00.000Z",
    ),
  ];
  const users: AdminUser[] = [
    {
      id: "demo-user-001",
      firstName: "Demo",
      lastName: "Administrator",
      email: "admin@example.local",
      phone: "+251900000001",
      employeeId: "DEMO-001",
      department: "Administration",
      position: "Administrator",
    },
    {
      id: "demo-user-002",
      firstName: "Demo",
      lastName: "Officer",
      email: "officer@example.local",
      phone: "+251900000002",
      employeeId: "DEMO-002",
      department: "Operations",
      position: "Bank Officer",
    },
  ];
  const groups: LocalState["groups"] = {};
  const approvalRules: LocalState["approvalRules"] = {};

  for (const contract of contracts) {
    groups[contract.id] = [];
    approvalRules[contract.id] = [];
  }

  return { contracts, users, groups, approvalRules };
}

function readState(): LocalState {
  if (typeof window === "undefined") {
    throw new Error("Local demo data is only available in the browser.");
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const state = createInitialState();
    writeState(state);
    return state;
  }

  let state: unknown;
  try {
    state = JSON.parse(raw);
    console.log("Local demo state loaded:", state);
  } catch {
    throw new Error(
      "Local demo data is unreadable. Clear this site’s local storage and reload.",
    );
  }
  if (
    !state ||
    typeof state !== "object" ||
    !Array.isArray((state as LocalState).contracts) ||
    !Array.isArray((state as LocalState).users)
  ) {
    throw new Error(
      "Local demo data has an invalid format. Clear this site’s local storage and reload.",
    );
  }

  const validState = state as LocalState;
  validState.groups ??= {};
  validState.approvalRules ??= {};
  return validState;
}

function writeState(state: LocalState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function readBody(init: RequestInit): Record<string, unknown> {
  if (typeof init.body !== "string" || !init.body) return {};
  const parsed: unknown = JSON.parse(init.body);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid request body.");
  }
  return parsed as Record<string, unknown>;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function findContract(state: LocalState, id: string): Contract {
  const contract = state.contracts.find(
    (item) => item.id === id && !item.deleted,
  );
  if (!contract)
    throw new LocalApiError("Contract not found", 404, "NOT_FOUND");
  return contract;
}

function findGroup(
  state: LocalState,
  contractId: string,
  groupId: string,
): SignatoryGroup {
  const group = (state.groups[contractId] ?? []).find(
    (item) => item.id === groupId,
  );
  if (!group)
    throw new LocalApiError("Signatory group not found", 404, "NOT_FOUND");
  return group;
}

function getStatistics(contracts: Contract[]) {
  const visible = contracts.filter((item) => !item.deleted);
  const count = (status: ContractStatus) =>
    visible.filter((item) => item.status === status).length;
  return {
    totalContracts: visible.length,
    activeContracts: count("ACTIVE"),
    pendingContracts: count("PENDING"),
    suspendedContracts: count("SUSPENDED"),
    expiredContracts: count("EXPIRED"),
    terminatedContracts: count("TERMINATED"),
    operationalContracts: visible.filter((item) => item.operational).length,
  };
}

function makeContractUser(
  contractId: string,
  body: Record<string, unknown>,
  roleName: string,
  permissionType: ContractUserPermissionType | null,
): ContractUser {
  const firstName =
    typeof body.firstName === "string" ? body.firstName : "Demo";
  const lastName = typeof body.lastName === "string" ? body.lastName : "User";
  const now = new Date().toISOString();
  const id = makeId("demo-contract-user");
  return {
    id,
    contractId,
    userId: makeId("demo-user"),
    username: `${firstName} ${lastName}`,
    email: typeof body.email === "string" ? body.email : "",
    phone: typeof body.phone === "string" ? body.phone : "",
    roleName,
    addedByUserId: DEMO_USER_ID,
    addedByUsername: "Local Demo",
    addedAt: now,
    expiresAt: null,
    signatoryMetrics: permissionType
      ? [makeContractUserPermissionMetric(id, permissionType)]
      : [],
    createdDate: now,
    active: true,
    expired: false,
    primaryAdmin: false,
  };
}

function parseContractUserPermissionType(
  value: string | null,
): ContractUserPermissionType | null {
  return (
    CONTRACT_USER_PERMISSION_TYPES.find(
      (permissionType) => permissionType === value,
    ) ?? null
  );
}

function makeContractUserPermissionMetric(
  contractUserId: string,
  permissionType: ContractUserPermissionType,
): ContractUser["signatoryMetrics"][number] {
  return {
    id: makeId("demo-signatory-metric"),
    contractUserId,
    permissionType,
    amountConstraint: "",
    amountLimit: 0,
    dailyLimit: 0,
    scopeConstraint: "",
    approvalLevel: 0,
    requiresAuthorization: false,
    priorityOrder: 1,
    restrictions: null,
    active: true,
  };
}

function updateContractUserPermission(
  user: ContractUser,
  permissionType: ContractUserPermissionType,
): ContractUser {
  const metrics = [...user.signatoryMetrics];
  const activeMetricIndex = metrics.findIndex((metric) => metric.active);
  if (activeMetricIndex < 0) {
    metrics.push(makeContractUserPermissionMetric(user.id, permissionType));
  } else {
    metrics[activeMetricIndex] = {
      ...metrics[activeMetricIndex],
      permissionType,
    };
  }
  return { ...user, signatoryMetrics: metrics };
}

export class LocalApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "LocalApiError";
  }
}

export async function handleLocalApiRequest(
  path: string,
  init: RequestInit,
): Promise<{ data: unknown; status: number }> {
  const url = new URL(path, "http://local.demo");
  const segments = url.pathname
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);
  const method = (init.method ?? "GET").toUpperCase();
  const body = readBody(init);
  const state = readState();

  if (segments[0] === "auth") {
    if (method === "POST" && segments[1] === "login") {
      const identifier =
        typeof body.identifier === "string" ? body.identifier.trim() : "";
      if (!identifier || typeof body.password !== "string" || !body.password) {
        throw new LocalApiError(
          "Enter an identifier and password.",
          400,
          "BAD_REQUEST",
        );
      }
      const user: AuthUser = {
        id: DEMO_USER_ID,
        roleId: ADMIN_ASSIGNABLE_ROLES[0].id,
        username: identifier,
        email: identifier.includes("@") ? identifier : undefined,
      };
      return { data: { ...createLocalTokenPair(user), user }, status: 200 };
    }
    if (method === "POST" && segments[1] === "verify-otp") {
      const identifier =
        typeof body.identifier === "string" ? body.identifier : "demo";
      const user: AuthUser = {
        id: DEMO_USER_ID,
        username: identifier,
        roleId: ADMIN_ASSIGNABLE_ROLES[0].id,
      };
      return { data: { ...createLocalTokenPair(user), user }, status: 200 };
    }
    if (method === "POST" && segments[1] === "reset-password") {
      return {
        data: {
          success: true,
          message: "Local demo password reset completed.",
        },
        status: 200,
      };
    }
  }

  if (segments[0] === "role" && method === "GET") {
    return { data: ADMIN_ASSIGNABLE_ROLES, status: 200 };
  }

  if (segments[0] === "admin" && segments[1] === "users") {
    const userId = segments[2];
    if (method === "GET" && !userId) return { data: state.users, status: 200 };
    if (method === "POST" && !userId) {
      const user: AdminUser = {
        id: makeId("demo-user"),
        firstName: String(body.firstName ?? ""),
        lastName: String(body.lastName ?? ""),
        email: String(body.email ?? ""),
        phone: String(body.phone ?? ""),
      };
      state.users.push(user);
      writeState(state);
      return { data: user, status: 201 };
    }
    if (userId) {
      const index = state.users.findIndex((user) => user.id === userId);
      if (index < 0)
        throw new LocalApiError("User not found", 404, "NOT_FOUND");
      if (method === "PUT") {
        state.users[index] = { ...state.users[index], ...body };
        writeState(state);
        return { data: state.users[index], status: 200 };
      }
      if (method === "DELETE") {
        state.users.splice(index, 1);
        writeState(state);
        return { data: null, status: 200 };
      }
    }
  }

  if (
    segments[0] === "accounts" &&
    segments[1] === "by-account-number" &&
    segments[2]
  ) {
    const accountNumber = segments[2];
    if (!/^\d{13}$/.test(accountNumber)) {
      throw new LocalApiError(
        "Enter a 13-digit demo account number.",
        404,
        "NOT_FOUND",
      );
    }
    return {
      data: {
        success: true,
        customerDetails: {
          customerId: `demo-customer-${accountNumber.slice(-4)}`,
          customerName: "Local Demo Customer",
          displayName: "Local Demo Customer",
          accountId: `demo-account-${accountNumber.slice(-4)}`,
          accountStatus: "ACTIVE",
          productName: "Demo Current Account",
          categoryName: "Current Account",
          currencyId: "ETB",
        },
      },
      status: 200,
    };
  }

  if (segments[0] === "contracts") {
    if (segments.length === 1 && method === "GET") {
      const status = url.searchParams.get("status");
      const activeOnly = url.searchParams.get("activeOnly") === "true";
      const contracts = state.contracts.filter(
        (contract) =>
          !contract.deleted &&
          (!status || contract.status === status) &&
          (!activeOnly || contract.active),
      );
      return { data: contracts, status: 200 };
    }
    if (segments[1] === "statistics" && method === "GET") {
      return { data: getStatistics(state.contracts), status: 200 };
    }
    if (method === "POST" && segments.length === 1) {
      const now = new Date().toISOString();
      const status: ContractStatus =
        body.autoActivate === true ? "ACTIVE" : "PENDING";
      const contract: Contract = {
        id: makeId("demo-contract"),
        customerId: String(body.customerId ?? "demo-customer"),
        contractName: String(body.contractName ?? "New demo contract"),
        description: String(body.description ?? ""),
        status,
        createdByUserId: DEMO_USER_ID,
        effectiveDate: String(body.effectiveDate ?? now),
        expiryDate: String(body.expiryDate ?? now),
        metadata: typeof body.metadata === "string" ? body.metadata : null,
        createdDate: now,
        lastModifiedDate: now,
        accountIds: Array.isArray(body.accountNumbersToLink)
          ? body.accountNumbersToLink.map(String)
          : [],
        users: [],
        activeUserCount: 0,
        accountCount: Array.isArray(body.accountNumbersToLink)
          ? body.accountNumbersToLink.length
          : 0,
        active: status === "ACTIVE",
        deleted: false,
        operational: status === "ACTIVE",
      };
      state.contracts.push(contract);
      state.groups[contract.id] = [];
      state.approvalRules[contract.id] = [];
      writeState(state);
      return { data: contract, status: 201 };
    }

    const contractId = segments[1];
    if (!contractId)
      throw new LocalApiError("Contract not found", 404, "NOT_FOUND");
    const contract = findContract(state, contractId);

    if (segments.length === 2) {
      if (method === "GET") return { data: contract, status: 200 };
      if (method === "PUT") {
        Object.assign(contract, body, {
          status:
            body.isActive === true
              ? "ACTIVE"
              : body.isActive === false
                ? "INACTIVE"
                : contract.status,
          active: body.isActive === true,
          operational: body.isActive === true,
          lastModifiedDate: new Date().toISOString(),
        });
        writeState(state);
        return { data: contract, status: 200 };
      }
      if (method === "DELETE") {
        contract.deleted = true;
        writeState(state);
        return { data: null, status: 200 };
      }
    }

    const action = segments[2];
    if (
      ["activate", "suspend", "terminate"].includes(action) &&
      ["POST", "PUT"].includes(method)
    ) {
      const nextStatus: ContractStatus =
        action === "activate"
          ? "ACTIVE"
          : action === "suspend"
            ? "SUSPENDED"
            : "TERMINATED";
      Object.assign(contract, {
        status: nextStatus,
        active: nextStatus === "ACTIVE",
        operational: nextStatus === "ACTIVE",
        lastModifiedDate: new Date().toISOString(),
      });
      writeState(state);
      return { data: contract, status: 200 };
    }

    if (action === "users") {
      const contractUsers = Array.isArray(contract.users)
        ? ([...contract.users] as ContractUser[])
        : [];
      if (segments.length === 3 && method === "POST") {
        const roleName = url.searchParams.get("roleId") ?? "DEMO_USER";
        const permissionType = parseContractUserPermissionType(
          url.searchParams.get("permissionType"),
        );
        const user = makeContractUser(
          contractId,
          body,
          roleName,
          permissionType,
        );
        contract.users = [...contractUsers, user];
        contract.activeUserCount = contractUsers.length + 1;
        writeState(state);
        return { data: user, status: 201 };
      }
      const linkedUserId = segments[3];
      if (linkedUserId && method === "PUT") {
        const index = contractUsers.findIndex(
          (user) => user.id === linkedUserId,
        );
        if (index < 0)
          throw new LocalApiError("Contract user not found", 404, "NOT_FOUND");
        const user = { ...contractUsers[index], ...body };
        const permissionType = parseContractUserPermissionType(
          url.searchParams.get("permissionType"),
        );
        const updatedUser = permissionType
          ? updateContractUserPermission(user, permissionType)
          : user;
        contractUsers[index] = updatedUser;
        contract.users = contractUsers;
        writeState(state);
        return { data: updatedUser, status: 200 };
      }
    }

    if (action === "signatory-groups") {
      const contractGroups =
        state.groups[contractId] ?? (state.groups[contractId] = []);
      if (segments.length === 3 && method === "GET") {
        return {
          data: contractGroups.filter((group) => group.active),
          status: 200,
        };
      }
      if (segments.length === 3 && method === "POST") {
        const members: SignatoryGroupMember[] = Array.isArray(body.members)
          ? (body.members as Array<{ contractUserId: string }>).map(
              (member, index) => ({
                id: makeId("demo-group-member"),
                contractUserId: String(member.contractUserId),
                userFullName: "Demo Contract User",
                userEmail: "user@example.local",
                active: true,
                approvalOrder: index + 1,
              }),
            )
          : [];
        const group: SignatoryGroup = {
          id: makeId("demo-group"),
          name: String(body.name ?? "New group"),
          description: String(body.description ?? ""),
          approvalRules: [],
          members,
          active: true,
        };
        contractGroups.push(group);
        writeState(state);
        return { data: group, status: 201 };
      }
      const groupId = segments[3];
      if (groupId) {
        const group = findGroup(state, contractId, groupId);
        if (segments.length === 4 && method === "PUT") {
          Object.assign(group, body);
          writeState(state);
          return { data: group, status: 200 };
        }
        if (segments.length === 4 && method === "DELETE") {
          group.active = false;
          writeState(state);
          return { data: null, status: 200 };
        }
        if (segments[4] === "members") {
          if (segments.length === 5 && method === "GET") {
            return {
              data: group.members.filter((member) => member.active),
              status: 200,
            };
          }
          if (segments.length === 5 && method === "POST") {
            const member: SignatoryGroupMember = {
              id: makeId("demo-group-member"),
              contractUserId: String(body.contractUserId ?? ""),
              userFullName: "Demo Contract User",
              userEmail: "user@example.local",
              active: true,
              approvalOrder:
                typeof body.approvalOrder === "number"
                  ? body.approvalOrder
                  : group.members.length + 1,
            };
            group.members.push(member);
            writeState(state);
            return { data: member, status: 201 };
          }
          if (segments[5] === "reorder" && method === "PUT") {
            const orders = Array.isArray(body.memberOrders)
              ? (body.memberOrders as Array<{
                  memberId: string;
                  approvalOrder: number;
                }>)
              : [];
            for (const order of orders) {
              const member = group.members.find(
                (item) => item.id === order.memberId,
              );
              if (member) member.approvalOrder = order.approvalOrder;
            }
            writeState(state);
            return { data: null, status: 200 };
          }
          const memberId = segments[5];
          if (memberId && method === "DELETE") {
            group.members = group.members.filter(
              (member) => member.id !== memberId,
            );
            writeState(state);
            return { data: null, status: 200 };
          }
          if (
            memberId &&
            segments[6] === "approval-order" &&
            method === "PATCH"
          ) {
            const member = group.members.find((item) => item.id === memberId);
            if (!member)
              throw new LocalApiError(
                "Group member not found",
                404,
                "NOT_FOUND",
              );
            member.approvalOrder = Number(body.approvalOrder);
            writeState(state);
            return { data: null, status: 200 };
          }
        }
      }
    }

    if (action === "approval-rules") {
      const rules =
        state.approvalRules[contractId] ??
        (state.approvalRules[contractId] = []);
      if (segments.length === 3 && method === "GET") {
        return { data: rules.filter((rule) => rule.active), status: 200 };
      }
      if (segments[3] === "signatory-group" && method === "GET") {
        return {
          data: rules.filter(
            (rule) => rule.signatoryGroupId === segments[4] && rule.active,
          ),
          status: 200,
        };
      }
      const ruleId = segments[3];
      if (ruleId && segments.length === 4 && method === "GET") {
        const rule = rules.find((item) => item.id === ruleId);
        if (!rule)
          throw new LocalApiError("Approval rule not found", 404, "NOT_FOUND");
        return { data: rule, status: 200 };
      }
      if (
        (!ruleId || segments.length === 4) &&
        ["POST", "PUT"].includes(method)
      ) {
        const existing = ruleId
          ? rules.find((item) => item.id === ruleId)
          : undefined;
        if (ruleId && !existing)
          throw new LocalApiError("Approval rule not found", 404, "NOT_FOUND");
        const rule: ContractApprovalRule = {
          id: existing?.id ?? makeId("demo-rule"),
          contractId,
          approvalType:
            url.searchParams.get("approvalType") ??
            existing?.approvalType ??
            "INTER_BANK_TRANSFER",
          approvalAction:
            url.searchParams.get("approvalAction") ??
            existing?.approvalAction ??
            "CREATE",
          minAmount: Number(body.minAmount ?? 0),
          maxAmount: Number(body.maxAmount ?? 0),
          signatoryGroupId: String(body.signatoryGroupId ?? ""),
          signatoryGroupName: (state.groups[contractId] ?? []).find(
            (group) => group.id === body.signatoryGroupId,
          )?.name,
          active: true,
        };
        if (existing) Object.assign(existing, rule);
        else rules.push(rule);
        writeState(state);
        return { data: rule, status: existing ? 200 : 201 };
      }
      if (ruleId && segments.length === 4 && method === "DELETE") {
        const rule = rules.find((item) => item.id === ruleId);
        if (!rule)
          throw new LocalApiError("Approval rule not found", 404, "NOT_FOUND");
        rule.active = false;
        writeState(state);
        return { data: null, status: 200 };
      }
    }
  }

  throw new LocalApiError(
    `Unsupported local demo request: ${method} ${url.pathname}`,
    404,
    "NOT_FOUND",
  );
}
