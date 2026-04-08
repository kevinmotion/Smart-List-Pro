import React, { useMemo, useState } from "react";
import { useStore, Item } from "../store";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Share2,
  TrendingDown,
  TrendingUp,
  Users,
  Tag as TagIcon,
  ChevronDown,
  Check,
  PieChart as PieChartIcon,
  User as UserIcon,
  Wallet,
  Info,
} from "lucide-react";
import { clsx } from "clsx";
import { NOTION_COLORS } from "../constants";
import { getInSoles, getNormalizedPrice, getBaseUnit } from "../utils/currency";

export const DashboardScreen = () => {
  const {
    items,
    groups,
    people,
    tags,
    togglePaidGroup,
    toggleIndividualPayment,
    exchangeRate,
    paymentMode,
    lists,
    activeListId,
  } = useStore();

  const activeList = lists.find((l) => l.id === activeListId);
  const isSolo = activeList?.type === "solo";

  const [activeTab, setActiveTab] = useState<"general" | "individual">(
    "general",
  );
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(
    people[0]?.id || null,
  );
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [isPersonDropdownOpen, setIsPersonDropdownOpen] = useState(false);

  // Ensure a person is selected if list was empty and now has people
  React.useEffect(() => {
    if (!selectedPersonId && people.length > 0) {
      setSelectedPersonId(people[0].id);
    }
  }, [people, selectedPersonId]);

  // Collapsible states
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(true);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);

  // --- Global KPIs ---
  const totalSpent = useMemo(() => {
    return items.reduce((acc, item) => {
      const itemTotal = item.price * item.quantity;
      return acc + getInSoles(itemTotal, exchangeRate, item.currency);
    }, 0);
  }, [items, exchangeRate]);

  const totalSavings = useMemo(() => {
    return items.reduce((acc, item) => {
      if (item.loserAlternative) {
        const chosenPrice = getNormalizedPrice(
          item.price,
          item.quantity,
          item.unit || "un",
          exchangeRate,
          item.currency,
          item.presentation,
        );
        const loserPrice = getNormalizedPrice(
          item.loserAlternative.price,
          item.loserAlternative.quantity,
          item.loserAlternative.unit,
          exchangeRate,
          item.currency,
        );

        const chosenBaseUnit = getBaseUnit(item.unit || "un");
        const loserBaseUnit = getBaseUnit(item.loserAlternative.unit);

        if (chosenBaseUnit === loserBaseUnit && loserPrice > chosenPrice) {
          let baseUnitsBought = item.presentation
            ? item.quantity * item.presentation
            : item.quantity;
          if (item.unit === "gr" || item.unit === "ml")
            baseUnitsBought = baseUnitsBought / 1000;
          return acc + (loserPrice - chosenPrice) * baseUnitsBought;
        }
      } else if (item.alternativePrice && item.alternativePrice > item.price) {
        return (
          acc +
          getInSoles(
            item.alternativePrice - item.price,
            exchangeRate,
            item.currency,
          ) *
            item.quantity
        );
      }
      return acc;
    }, 0);
  }, [items]);

  // --- Tab 1: Vista General Data ---
  const groupsData = useMemo(() => {
    return groups.map((g) => {
      const groupItems = items.filter((i) => i.groupId === g.id);
      const total = groupItems.reduce((acc, i) => {
        const itemTotal = i.price * i.quantity;
        return acc + getInSoles(itemTotal, exchangeRate, i.currency);
      }, 0);
      const quota = g.peopleIds.length > 0 ? total / g.peopleIds.length : 0;
      const colorVars = NOTION_COLORS.find((c) => c.bgVar === g.color) || {
        textVar: g.color,
      };
      return { ...g, total, quota, displayColor: colorVars.textVar };
    });
  }, [groups, items]);

  const tagsData = useMemo(() => {
    const data = tags
      .map((t) => {
        const tagItems = items.filter((i) => i.tagId === t.id);
        const total = tagItems.reduce((acc, i) => {
          const itemTotal = i.price * i.quantity;
          return acc + getInSoles(itemTotal, exchangeRate, i.currency);
        }, 0);
        return { ...t, value: total };
      })
      .filter((t) => t.value > 0);

    // Sort by value descending
    return data.sort((a, b) => b.value - a.value);
  }, [tags, items]);

  const DASHBOARD_COLORS = useMemo(() => {
    const baseColors = NOTION_COLORS.filter((c) => c.id !== "default").map(
      (c) => c.textVar,
    );
    // Shuffle colors for categories
    return [...baseColors].sort(() => Math.random() - 0.5);
  }, []);

  const { rompeBolsillos, gangazo } = useMemo(() => {
    let maxTotal = 0;
    let maxItem: Item | null = null;

    let maxSavingsPct = 0;
    let maxSavingsItem: Item | null = null;

    items.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      const total = getInSoles(itemTotal, exchangeRate, item.currency);
      if (total > maxTotal) {
        maxTotal = total;
        maxItem = item;
      }

      if (item.loserAlternative) {
        const chosenPrice = getNormalizedPrice(
          item.price,
          item.quantity,
          item.unit || "un",
          exchangeRate,
          item.currency,
          item.presentation,
        );
        const loserPrice = getNormalizedPrice(
          item.loserAlternative.price,
          item.loserAlternative.quantity,
          item.loserAlternative.unit,
          exchangeRate,
          item.currency,
        );
        const chosenBaseUnit = getBaseUnit(item.unit || "un");
        const loserBaseUnit = getBaseUnit(item.loserAlternative.unit);

        if (chosenBaseUnit === loserBaseUnit && loserPrice > chosenPrice) {
          const savingsPct = ((loserPrice - chosenPrice) / loserPrice) * 100;
          if (savingsPct > maxSavingsPct) {
            maxSavingsPct = savingsPct;
            maxSavingsItem = item;
          }
        }
      } else if (item.alternativePrice && item.alternativePrice > item.price) {
        const savingsPct =
          ((item.alternativePrice - item.price) / item.alternativePrice) * 100;
        if (savingsPct > maxSavingsPct) {
          maxSavingsPct = savingsPct;
          maxSavingsItem = item;
        }
      }
    });

    return {
      rompeBolsillos: maxItem,
      gangazo: { item: maxSavingsItem, pct: maxSavingsPct },
    };
  }, [items]);

  // --- Tab 3: Resumen de Pagos Data ---
  const paymentSummaryData = useMemo(() => {
    const summary: Record<
      string,
      { name: string; paid: number; share: number; balance: number }
    > = {};
    const detailedDebts: Array<{
      fromId: string;
      toId: string;
      groupId: string;
      groupName: string;
      amount: number;
      isPaid: boolean;
    }> = [];

    groups.forEach((g) => {
      const groupItems = items.filter((i) => i.groupId === g.id);
      const total = groupItems.reduce((acc, i) => {
        const itemTotal = i.price * i.quantity;
        return acc + getInSoles(itemTotal, exchangeRate, i.currency);
      }, 0);

      const quota = g.peopleIds.length > 0 ? total / g.peopleIds.length : 0;

      // Track everyone who interacted with this group (members + non-member payers)
      const allParticipants = new Set([...g.peopleIds]);
      groupItems.forEach((i) => {
        const payerId = i.paidById || g.organizerId || g.peopleIds[0];
        if (payerId) allParticipants.add(payerId);
      });

      const groupBalances: Record<string, number> = {};

      allParticipants.forEach((pid) => {
        const person = people.find((p) => p.id === pid);
        if (!person) return;

        if (!summary[pid]) {
          summary[pid] = { name: person.name, paid: 0, share: 0, balance: 0 };
        }

        const share = g.peopleIds.includes(pid) ? quota : 0;
        summary[pid].share += share;

        const paidByPerson = groupItems.reduce((acc, item) => {
          const payerId = item.paidById || g.organizerId || g.peopleIds[0];
          if (payerId === pid) {
            const itemTotal = item.price * item.quantity;
            return acc + getInSoles(itemTotal, exchangeRate, item.currency);
          }
          return acc;
        }, 0);
        summary[pid].paid += paidByPerson;

        groupBalances[pid] = paidByPerson - share;
      });

      if (paymentMode === "centralized" && g.organizerId) {
        const organizerId = g.organizerId;
        Object.entries(groupBalances).forEach(([pid, bal]) => {
          if (pid === organizerId) return;
          if (bal < -0.01) {
            const fromPerson = people.find((p) => p.id === pid);
            const isPaid =
              fromPerson?.individualPayments?.[g.id]?.[organizerId] || false;
            detailedDebts.push({
              fromId: pid,
              toId: organizerId,
              groupId: g.id,
              groupName: g.name,
              amount: Math.abs(bal),
              isPaid,
            });
          } else if (bal > 0.01) {
            const fromPerson = people.find((p) => p.id === organizerId);
            const isPaid =
              fromPerson?.individualPayments?.[g.id]?.[pid] || false;
            detailedDebts.push({
              fromId: organizerId,
              toId: pid,
              groupId: g.id,
              groupName: g.name,
              amount: bal,
              isPaid,
            });
          }
        });
      } else {
        const creditors = Object.entries(groupBalances).filter(
          ([_, bal]) => bal > 0.01,
        );
        const debtors = Object.entries(groupBalances).filter(
          ([_, bal]) => bal < -0.01,
        );
        const totalPositive = creditors.reduce((acc, [_, bal]) => acc + bal, 0);

        if (totalPositive > 0.01) {
          debtors.forEach(([debtorId, debtorBal]) => {
            const amountToPay = Math.abs(debtorBal);
            creditors.forEach(([creditorId, creditorBal]) => {
              const oweAmount = amountToPay * (creditorBal / totalPositive);
              if (oweAmount > 0.01) {
                const fromPerson = people.find((p) => p.id === debtorId);
                const isPaid =
                  fromPerson?.individualPayments?.[g.id]?.[creditorId] || false;
                detailedDebts.push({
                  fromId: debtorId,
                  toId: creditorId,
                  groupId: g.id,
                  groupName: g.name,
                  amount: oweAmount,
                  isPaid,
                });
              }
            });
          });
        }
      }
    });

    const summaryList = Object.values(summary)
      .map((p) => ({
        ...p,
        balance: p.paid - p.share,
      }))
      .filter((p) => p.paid > 0 || p.share > 0)
      .sort((a, b) => b.balance - a.balance);

    return { summary: summaryList, detailedDebts };
  }, [items, groups, people, exchangeRate, paymentMode]);

  const { summary: paymentSummary, detailedDebts } = paymentSummaryData;

  // --- Tab 2: Cuenta Individual Data ---
  const personDebtData = useMemo(() => {
    if (!selectedPersonId) return null;
    const person = people.find((p) => p.id === selectedPersonId);
    if (!person) return null;

    // Calculate unpaid debt and unpaid receivables for this specific person
    const unpaidDebtsForPerson = detailedDebts.filter(
      (d) => d.fromId === person.id && !d.isPaid,
    );
    const unpaidReceivablesForPerson = detailedDebts.filter(
      (d) => d.toId === person.id && !d.isPaid,
    );

    const debtByGroup = groups
      .filter((g) => {
        const isMember = g.peopleIds.includes(person.id);
        const hasPaid = items.some(
          (i) =>
            i.groupId === g.id &&
            (i.paidById === person.id ||
              (!i.paidById && g.organizerId === person.id)),
        );
        return isMember || hasPaid;
      })
      .map((g) => {
        const groupItems = items.filter((i) => i.groupId === g.id);
        const total = groupItems.reduce((acc, i) => {
          const itemTotal = i.price * i.quantity;
          return acc + getInSoles(itemTotal, exchangeRate, i.currency);
        }, 0);

        const paidByPerson = groupItems.reduce((acc, i) => {
          const payerId = i.paidById || g.organizerId || g.peopleIds[0];
          if (payerId === person.id) {
            const itemTotal = i.price * i.quantity;
            return acc + getInSoles(itemTotal, exchangeRate, i.currency);
          }
          return acc;
        }, 0);

        const isMember = g.peopleIds.includes(person.id);
        const quota =
          isMember && g.peopleIds.length > 0 ? total / g.peopleIds.length : 0;
        const balance = paidByPerson - quota;

        const colorVars = NOTION_COLORS.find((c) => c.bgVar === g.color) || {
          textVar: g.color,
        };

        // A group is "settled" if:
        // 1. The person is a debtor and has no unpaid outgoing debts for this group
        // 2. The person is a creditor and has no unpaid incoming debts for this group
        // 3. The net balance is zero (meaning no debts or receivables should exist)
        const groupUnpaidDebts = unpaidDebtsForPerson.filter(
          (d) => d.groupId === g.id,
        );
        const groupUnpaidReceivables = unpaidReceivablesForPerson.filter(
          (d) => d.groupId === g.id,
        );

        const isSettled =
          groupUnpaidDebts.length === 0 && groupUnpaidReceivables.length === 0;

        const pendingAmount =
          groupUnpaidDebts.length > 0
            ? groupUnpaidDebts.reduce((acc, d) => acc + d.amount, 0)
            : groupUnpaidReceivables.length > 0
              ? groupUnpaidReceivables.reduce((acc, d) => acc + d.amount, 0)
              : 0;

        return {
          groupName: g.name,
          quota,
          paidByPerson,
          balance,
          pendingAmount,
          inGroup: isMember,
          totalPeople: g.peopleIds.length,
          color: colorVars.textVar,
          groupId: g.id,
          isPaid: isSettled,
        };
      })
      .sort((a, b) => {
        if (a.isPaid === b.isPaid) return 0;
        return a.isPaid ? 1 : -1;
      });

    // Total debt/receivable is now based on unpaid individual transactions
    const totalDebt = unpaidDebtsForPerson.reduce(
      (acc, d) => acc + d.amount,
      0,
    );
    const totalToReceive = unpaidReceivablesForPerson.reduce(
      (acc, d) => acc + d.amount,
      0,
    );

    return { person, debtByGroup, totalDebt, totalToReceive };
  }, [selectedPersonId, groups, items, people, exchangeRate, detailedDebts]);

  // --- Handlers ---
  const handleShareGeneral = async () => {
    const text = `📊 Resumen de Gastos\nTotal General: S/ ${totalSpent.toFixed(2)}\nAhorro: S/ ${totalSavings.toFixed(2)}\n\nGrupos:\n${groupsData.map((g) => `- ${g.name}: S/ ${g.total.toFixed(2)} (Cuota: S/ ${g.quota.toFixed(2)} p/p)`).join("\n")}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Resumen de Gastos", text });
      } catch (e) {
        console.error("Error sharing", e);
      }
    } else {
      alert("La función de compartir no está disponible en este navegador.");
    }
  };

  const handleShareIndividual = async () => {
    if (!personDebtData) return;
    const { person, totalDebt, totalToReceive, debtByGroup } = personDebtData;

    const groupBreakdown = debtByGroup
      .filter((g) => g.inGroup && Math.abs(g.balance) > 0.01)
      .map((g) => {
        const payments = detailedDebts.filter(
          (d) => d.fromId === person.id && d.groupId === g.groupId && !d.isPaid,
        );
        const receivables = detailedDebts.filter(
          (d) => d.toId === person.id && d.groupId === g.groupId && !d.isPaid,
        );

        let detailText = `- ${g.groupName}: S/ ${Math.abs(g.balance).toFixed(2)} (${g.balance > 0 ? "A favor" : "Por pagar"})`;

        if (payments.length > 0) {
          detailText += `\n  Pagar a: ${payments.map((p) => `${people.find((pp) => pp.id === p.toId)?.name} S/ ${p.amount.toFixed(2)}`).join(", ")}`;
        }
        if (receivables.length > 0) {
          detailText += `\n  Deben pagarte: ${receivables.map((p) => `${people.find((pp) => pp.id === p.fromId)?.name} S/ ${p.amount.toFixed(2)}`).join(", ")}`;
        }

        return detailText;
      })
      .join("\n");

    let text = "";
    if (totalDebt > 0) {
      text = `¡Hola ${person.name}! ⚓\n\nEl total de tu cuota pendiente es S/ ${totalDebt.toFixed(2)}.\n\nDesglose:\n${groupBreakdown}\n\n¡Porfa yapéame cuando puedas! 🙌`;
    } else {
      text = `¡Hola ${person.name}! ⚓\n\nHe revisado las cuentas y tienes un saldo a favor de S/ ${totalToReceive.toFixed(2)}.\n\nDesglose:\n${groupBreakdown}\n\n¡Te aviso cuando me paguen los demás! 🙌`;
    }

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (e) {
        console.error("Error sharing", e);
      }
    } else {
      alert("La función de compartir no está disponible en este navegador.");
    }
  };

  if (totalSpent === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-500 dark:text-gray-400">
        <p>No hay datos suficientes para mostrar el dashboard.</p>
        <p className="text-sm mt-2">Añade ítems en la pestaña de Lista.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-notion-bg dark:bg-notion-dark-bg">
      {/* 6.1. Header Fijo y KPIs Globales */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-notion-dark-bg/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Total General Gastado
            </h2>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              S/ {totalSpent.toFixed(2)}
            </p>
            {totalSavings > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-sm font-medium">
                <TrendingDown size={16} />
                <span>Ahorraste S/ {totalSavings.toFixed(2)}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleShareGeneral}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center transition-colors"
          >
            <Share2 size={20} />
          </button>
        </div>

        {/* 6.2. Navegación por Pestañas */}
        {!isSolo && (
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mt-6">
            <button
              onClick={() => setActiveTab("general")}
              className={clsx(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
                activeTab === "general"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
              )}
            >
              <PieChartIcon size={16} />
              Vista General
            </button>
            <button
              onClick={() => setActiveTab("individual")}
              className={clsx(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
                activeTab === "individual"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
              )}
            >
              <UserIcon size={16} />
              Cuenta Individual
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* 6.3. Tab 1: Vista General */}
        {(activeTab === "general" || isSolo) && (
          <>
            {/* Card A: Estado de los Grupos */}
            {!isSolo && (
              <div className="bg-white dark:bg-notion-dark-gray-bg p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <button
                  className="w-full flex items-center justify-between"
                  onClick={() => setIsGroupsExpanded(!isGroupsExpanded)}
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Users size={20} className="text-gray-500" />
                    Estado de los Grupos
                  </h3>
                  <ChevronDown
                    size={20}
                    className={clsx(
                      "text-gray-400 transition-transform",
                      isGroupsExpanded && "rotate-180",
                    )}
                  />
                </button>

                {isGroupsExpanded && (
                  <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2">
                    {groupsData.map((g) => (
                      <div key={g.id} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: g.displayColor || "#9B9A97",
                              }}
                            />
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {g.name}
                            </span>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            S/ {g.total.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                            {g.peopleIds.length} personas
                          </span>
                          <span className="text-gray-400 dark:text-gray-500 font-bold text-sm">
                            cuota: S/ {g.quota.toFixed(2)}
                          </span>
                        </div>
                        {/* Visual progress bar representing proportion of total spent */}
                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${totalSpent > 0 ? (g.total / totalSpent) * 100 : 0}%`,
                              backgroundColor: g.displayColor || "#9B9A97",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Card B: Gráfico de Distribución por Categorías */}
            <div className="bg-white dark:bg-notion-dark-gray-bg p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <TagIcon size={20} className="text-gray-500" />
                  Distribución por Categorías
                </h3>
                <ChevronDown
                  size={20}
                  className={clsx(
                    "text-gray-400 transition-transform",
                    isCategoriesExpanded && "rotate-180",
                  )}
                />
              </button>

              {isCategoriesExpanded && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                  {tagsData.length > 0 ? (
                    <div className="flex flex-col items-center">
                      <div className="h-48 w-full relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <PieChart>
                            <Pie
                              data={tagsData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              onMouseEnter={(_, index) =>
                                setActiveTagIndex(index)
                              }
                              onMouseLeave={() => setActiveTagIndex(null)}
                            >
                              {tagsData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    DASHBOARD_COLORS[
                                      index % DASHBOARD_COLORS.length
                                    ]
                                  }
                                  opacity={
                                    activeTagIndex === null ||
                                    activeTagIndex === index
                                      ? 1
                                      : 0.3
                                  }
                                  className="transition-opacity duration-300 outline-none"
                                />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(value: number) =>
                                `S/ ${value.toFixed(2)}`
                              }
                              contentStyle={{
                                borderRadius: "12px",
                                border: "none",
                                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">
                            Total
                          </span>
                          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            S/ {totalSpent.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Leyenda Interactiva */}
                      <div className="w-full mt-4 space-y-2">
                        {tagsData.map((tag, index) => {
                          const percentage = (
                            (tag.value / totalSpent) *
                            100
                          ).toFixed(1);
                          return (
                            <div
                              key={tag.id}
                              className={clsx(
                                "flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer",
                                activeTagIndex === index
                                  ? "bg-gray-50 dark:bg-gray-700/50"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-700/30",
                              )}
                              onMouseEnter={() => setActiveTagIndex(index)}
                              onMouseLeave={() => setActiveTagIndex(null)}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor:
                                      DASHBOARD_COLORS[
                                        index % DASHBOARD_COLORS.length
                                      ],
                                  }}
                                />
                                <span className="text-lg">{tag.emoji}</span>
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {tag.name}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  S/ {tag.value.toFixed(2)}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 w-10 inline-block text-right">
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No hay categorías registradas.
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* 6.4. Tab 2: Cuenta Individual */}
        {activeTab === "individual" && (
          <div className="space-y-4">
            {/* Selector de Persona (Dropdown/Collapsible) */}
            <div className="relative">
              <button
                onClick={() => setIsPersonDropdownOpen(!isPersonDropdownOpen)}
                className="w-full bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full flex items-center justify-center font-bold text-lg">
                    {personDebtData?.person.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                      Viendo cuenta de
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {personDebtData?.person.name || "Selecciona una persona"}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  size={20}
                  className={clsx(
                    "text-gray-400 transition-transform",
                    isPersonDropdownOpen && "rotate-180",
                  )}
                />
              </button>

              {isPersonDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-notion-dark-gray-bg border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-20 p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-wrap gap-2">
                    {people.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPersonId(p.id);
                          setIsPersonDropdownOpen(false);
                        }}
                        className={clsx(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                          selectedPersonId === p.id
                            ? "bg-cyan-600 border-cyan-600 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-800 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
                        )}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dashboard Personalizado */}
            {personDebtData && (
              <div className="bg-white dark:bg-notion-dark-gray-bg rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div
                  className={clsx(
                    "p-6 text-white text-center transition-colors",
                    personDebtData.totalDebt > 0
                      ? "bg-gray-900 dark:bg-[#111111]"
                      : personDebtData.totalToReceive > 0
                        ? "bg-emerald-600 dark:bg-emerald-900/50"
                        : "bg-cyan-600 dark:bg-cyan-900/50",
                  )}
                >
                  <p className="text-gray-300 text-sm font-medium uppercase tracking-wider mb-1">
                    {personDebtData.totalDebt > 0
                      ? `Cuenta de ${personDebtData.person.name}`
                      : personDebtData.totalToReceive > 0
                        ? `Saldo a favor de ${personDebtData.person.name}`
                        : `Cuentas al día: ${personDebtData.person.name}`}
                  </p>
                  <p className="text-5xl font-bold">
                    {personDebtData.totalDebt > 0
                      ? `S/ ${personDebtData.totalDebt.toFixed(2)}`
                      : personDebtData.totalToReceive > 0
                        ? `S/ ${personDebtData.totalToReceive.toFixed(2)}`
                        : "S/ 0.00"}
                  </p>
                  {personDebtData.totalDebt > 0 &&
                    personDebtData.totalToReceive > 0 && (
                      <p className="mt-2 text-sm text-emerald-400 font-medium">
                        (Tienes S/ {personDebtData.totalToReceive.toFixed(2)}{" "}
                        por cobrar)
                      </p>
                    )}
                  {personDebtData.totalDebt === 0 &&
                    personDebtData.totalToReceive === 0 && (
                      <p className="mt-2 text-sm text-cyan-200 font-medium">
                        ¡No tienes deudas ni saldos pendientes!
                      </p>
                    )}
                </div>

                <div className="p-5 space-y-4">
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Resumen por Grupo
                  </h4>

                  <div className="space-y-3">
                    {personDebtData.debtByGroup.map((g, idx) => {
                      const groupPayments = detailedDebts.filter(
                        (d) =>
                          d.fromId === personDebtData.person.id &&
                          d.groupId === g.groupId,
                      );
                      const groupReceivables = detailedDebts.filter(
                        (d) =>
                          d.toId === personDebtData.person.id &&
                          d.groupId === g.groupId,
                      );

                      return (
                        <div
                          key={idx}
                          className={clsx(
                            "p-3 rounded-xl border transition-all space-y-3",
                            g.isPaid
                              ? "border-transparent bg-gray-50 dark:bg-notion-dark-bg/30 opacity-50 grayscale"
                              : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-notion-dark-bg/50",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{
                                  backgroundColor: g.isPaid
                                    ? "#9B9A97"
                                    : g.color || "#9B9A97",
                                }}
                              />
                              <p
                                className={clsx(
                                  "font-bold",
                                  g.isPaid
                                    ? "text-gray-500 dark:text-gray-400"
                                    : "text-gray-900 dark:text-gray-100",
                                )}
                              >
                                {g.groupName}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={clsx(
                                  "text-[10px] uppercase tracking-wider font-bold",
                                  g.isPaid
                                    ? "text-gray-400"
                                    : g.balance > 0
                                      ? "text-emerald-500"
                                      : "text-gray-400",
                                )}
                              >
                                {g.isPaid
                                  ? g.totalPeople <= 1 && g.inGroup
                                    ? "Gasto Individual"
                                    : "Cuentas al día"
                                  : g.balance > 0
                                    ? g.inGroup
                                      ? "Por cobrar"
                                      : "Aportante Externo"
                                    : "Tu cuota"}
                              </p>
                              <p
                                className={clsx(
                                  "font-bold",
                                  g.isPaid
                                    ? "text-gray-500 dark:text-gray-400"
                                    : g.balance > 0
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-gray-900 dark:text-gray-100",
                                )}
                              >
                                S/{" "}
                                {g.isPaid
                                  ? g.paidByPerson.toFixed(2)
                                  : g.pendingAmount.toFixed(2)}
                              </p>
                              {g.isPaid && (
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                  Total aportado / gastado
                                </p>
                              )}
                            </div>
                          </div>

                          {/* What I owe to others in this group */}
                          {groupPayments.length > 0 && (
                            <div className="pl-4 border-l-2 border-red-200 dark:border-red-900/30 space-y-2">
                              <p className="text-[10px] uppercase tracking-wider font-bold text-red-400 mb-1">
                                Pagar a:
                              </p>
                              {groupPayments.map((dp, dIdx) => {
                                const toPerson = people.find(
                                  (p) => p.id === dp.toId,
                                );
                                return (
                                  <div
                                    key={dIdx}
                                    className="flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          toggleIndividualPayment(
                                            personDebtData.person.id,
                                            g.groupId,
                                            dp.toId,
                                          )
                                        }
                                        className={clsx(
                                          "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                          dp.isPaid
                                            ? "bg-cyan-500 border-cyan-500 text-white"
                                            : "border-gray-300 dark:border-gray-600",
                                        )}
                                      >
                                        {dp.isPaid && <Check size={10} />}
                                      </button>
                                      <span
                                        className={clsx(
                                          "text-xs",
                                          dp.isPaid
                                            ? "text-gray-400 line-through"
                                            : "text-gray-700 dark:text-gray-300",
                                        )}
                                      >
                                        {toPerson?.name}
                                      </span>
                                    </div>
                                    <span
                                      className={clsx(
                                        "text-xs font-bold",
                                        dp.isPaid
                                          ? "text-gray-400"
                                          : "text-gray-900 dark:text-gray-100",
                                      )}
                                    >
                                      S/ {dp.amount.toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* What others owe me in this group */}
                          {groupReceivables.length > 0 && (
                            <div className="pl-4 border-l-2 border-emerald-200 dark:border-emerald-900/30 space-y-2">
                              <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 mb-1">
                                Deben pagarte:
                              </p>
                              {groupReceivables.map((dp, dIdx) => {
                                const fromPerson = people.find(
                                  (p) => p.id === dp.fromId,
                                );
                                return (
                                  <div
                                    key={dIdx}
                                    className="flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          toggleIndividualPayment(
                                            dp.fromId,
                                            g.groupId,
                                            personDebtData.person.id,
                                          )
                                        }
                                        className={clsx(
                                          "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                          dp.isPaid
                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                            : "border-gray-300 dark:border-gray-600",
                                        )}
                                      >
                                        {dp.isPaid && <Check size={10} />}
                                      </button>
                                      <span
                                        className={clsx(
                                          "text-xs",
                                          dp.isPaid
                                            ? "text-gray-400 line-through"
                                            : "text-gray-700 dark:text-gray-300",
                                        )}
                                      >
                                        {fromPerson?.name}
                                      </span>
                                    </div>
                                    <span
                                      className={clsx(
                                        "text-xs font-bold",
                                        dp.isPaid
                                          ? "text-gray-400"
                                          : "text-gray-900 dark:text-gray-100",
                                      )}
                                    >
                                      S/ {dp.amount.toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleShareIndividual}
                    disabled={
                      personDebtData.totalDebt === 0 &&
                      personDebtData.totalToReceive === 0
                    }
                    className={clsx(
                      "w-full mt-6 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md",
                      personDebtData.totalDebt > 0
                        ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                        : "bg-cyan-500 hover:bg-cyan-600 shadow-cyan-500/20",
                    )}
                  >
                    <Share2 size={20} />
                    {personDebtData.totalDebt > 0
                      ? `Enviar Cobro a ${personDebtData.person.name}`
                      : `Enviar Recordatorio de Pago a ${personDebtData.person.name}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Spacer to allow scrolling past the nav bar */}
        <div className="h-24" />
      </div>
    </div>
  );
};
