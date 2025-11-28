// app/(tabs)/home/dheeto/[id].tsx
import { View, Text, TouchableOpacity, ScrollView, Alert, RefreshControl } from "react-native";
import { ChevronLeft, Package, TrendingUp, Edit2 } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { EditItemModal, EditTransactionModal, AddItemModal, AddTransactionModal, EditDheetoModal } from "@/lib/components/dheeto-components";
import { LoadingSpinner } from "@/lib/components/loading-spinner";
import { getDheetoById } from "@/lib/api/api_providers";

export default function DheetoDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [dheeto, setDheeto] = useState<Dheeto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showEditDheeto, setShowEditDheeto] = useState(false);

  const loadDheeto = async (isRefresh = false) => {
    if (!id) return;
    try {
      if (!isRefresh) setLoading(true);
      const response = await getDheetoById(id);
      if (response.success && response.data) {
        setDheeto(response.data);
      } else {
        throw new Error(response.success === false ? response.message : "Failed to load dheeto");
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to load dheeto");
      if (!isRefresh) router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDheeto(true);
  };

  useEffect(() => {
    loadDheeto();
  }, [id]);

  if (loading || !dheeto) return <LoadingSpinner />;

  // Calculate totals
  const totalGoldWeight = dheeto.items
    .filter((item) => item.type === "gold")
    .reduce((sum, item) => sum + item.weightInTola, 0);
  
  const totalSilverWeight = dheeto.items
    .filter((item) => item.type === "silver")
    .reduce((sum, item) => sum + item.weightInTola, 0);
  
  const totalGave = dheeto.transactions
    .filter((t) => t.type === "gave")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalReceived = dheeto.transactions
    .filter((t) => t.type === "received")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalReceived - totalGave;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 pt-12 pb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="p-2 -ml-2 active:bg-gray-100 rounded-full" 
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color="#374151" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Dheeto Details</Text>
          <TouchableOpacity 
            onPress={() => setShowEditDheeto(true)} 
            className="p-2 -mr-2 active:bg-gray-100 rounded-full" 
            activeOpacity={0.7}
          >
            <Edit2 size={20} color="#374151" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        {dheeto.desc && (
          <Text className="text-sm text-gray-600 text-center mt-1 px-4" numberOfLines={2}>
            {dheeto.desc}
          </Text>
        )}
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Items Section */}
        <View className="mx-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Package size={20} color="#D97706" strokeWidth={2.5} />
              <Text className="text-lg font-bold text-gray-900">Items</Text>
              <Text className="text-sm text-gray-500">({dheeto.items.length})</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowAddItem(true)} 
              className="bg-amber-600 px-3 py-1.5 rounded-lg active:bg-amber-700" 
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-sm">+ Add</Text>
            </TouchableOpacity>
          </View>

          {dheeto.items.length === 0 ? (
            <View className="bg-gray-50 rounded-lg p-8 items-center border border-gray-200">
              <Package size={32} color="#9CA3AF" strokeWidth={2} />
              <Text className="text-gray-500 font-medium text-sm mt-2">No items yet</Text>
            </View>
          ) : (
            <View className="gap-2">
              {dheeto.items.map((item) => (
                <View 
                  key={item._id} 
                  className={`rounded-lg p-4 border ${
                    item.type === "gold" 
                      ? "bg-amber-50 border-amber-200" 
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 pr-3">
                      <Text className="font-semibold text-gray-900 text-base mb-1">
                        {item.name}
                      </Text>
                      {item.desc && (
                        <Text className="text-sm text-gray-600 mb-2">{item.desc}</Text>
                      )}
                    </View>
                    <TouchableOpacity 
                      onPress={() => setEditingItem(item)} 
                      className="p-2 active:bg-gray-100 rounded-lg -mt-1" 
                      activeOpacity={0.7}
                    >
                      <Edit2 size={16} color="#6B7280" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-4">
                      <View>
                        <Text className="text-xs text-gray-500 mb-0.5">Purity</Text>
                        <Text className="text-sm font-semibold text-gray-900">
                          {item.purity} carat
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xs text-gray-500 mb-0.5">Weight</Text>
                        <Text className="text-sm font-semibold text-gray-900">
                          {item.weightInTola} tola
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-gray-400">
                        {item.isSettled && item.settledAt 
                          ? `settled ${new Date(item.settledAt).toLocaleDateString()}`
                          : "active"}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Items Summary */}
        <SummaryCard
          title="Item Summary"
          items={[
            { label: "Gold", value: `${totalGoldWeight.toFixed(2)} tola`, valueClass: "text-yellow-700" },
            { label: "Silver", value: `${totalSilverWeight.toFixed(2)} tola`, valueClass: "text-gray-700" },
          ]}
        />

        {/* Transactions Section */}
        <View className="mx-4 mt-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <TrendingUp size={20} color="#2563EB" strokeWidth={2.5} />
              <Text className="text-lg font-bold text-gray-900">Transactions</Text>
              <Text className="text-sm text-gray-500">({dheeto.transactions.length})</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowAddTransaction(true)} 
              className="bg-blue-600 px-3 py-1.5 rounded-lg active:bg-blue-700" 
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-sm">+ Add</Text>
            </TouchableOpacity>
          </View>

          {dheeto.transactions.length === 0 ? (
            <View className="bg-gray-50 rounded-lg p-8 items-center border border-gray-200">
              <TrendingUp size={32} color="#9CA3AF" strokeWidth={2} />
              <Text className="text-gray-500 font-medium text-sm mt-2">No transactions yet</Text>
            </View>
          ) : (
            <>
              <View className="gap-2 mb-3">
                {dheeto.transactions.map((transaction) => (
                  <View 
                    key={transaction._id} 
                    className={`rounded-lg p-4 border ${
                      transaction.type === "gave" 
                        ? "bg-red-50 border-red-200" 
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1 pr-3">
                        <View className="flex-row items-center gap-2 mb-1">
                          <View 
                            className={`px-2 py-0.5 rounded ${
                              transaction.type === "gave" ? "bg-red-100" : "bg-green-100"
                            }`}
                          >
                            <Text 
                              className={`text-xs font-semibold ${
                                transaction.type === "gave" ? "text-red-700" : "text-green-700"
                              }`}
                            >
                              {transaction.type === "gave" ? "GAVE" : "RECEIVED"}
                            </Text>
                          </View>
                        </View>
                        {transaction.desc && (
                          <Text className="text-sm text-gray-600 mt-1">{transaction.desc}</Text>
                        )}
                      </View>
                      <TouchableOpacity 
                        onPress={() => setEditingTransaction(transaction)} 
                        className="p-2 active:bg-gray-100 rounded-lg -mt-1" 
                        activeOpacity={0.7}
                      >
                        <Edit2 size={16} color="#6B7280" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>

                    <View className="flex-row items-end justify-between">
                      <View>
                        <Text className="text-xs text-gray-500 mb-0.5">Amount</Text>
                        <Text className="text-xl font-bold text-gray-900">
                          ₹{transaction.amount.toLocaleString()}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs text-gray-400">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </Text>
                        <Text className="text-xs text-gray-400">
                          {new Date(transaction.createdAt).toLocaleTimeString([], { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Transaction Summary */}
              <SummaryCard
                title="Transaction Summary"
                items={[
                  { label: "Gave", value: `₹${totalGave.toLocaleString()}`, valueClass: "text-red-600" },
                  { label: "Received", value: `₹${totalReceived.toLocaleString()}`, valueClass: "text-green-600" },
                  {
                    label: "Balance",
                    value: `${balance >= 0 ? "+" : ""}₹${balance.toLocaleString()}`,
                    valueClass: balance >= 0 ? "text-green-700" : "text-red-700",
                  },
                ]}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      {editingItem && (
        <EditItemModal 
          item={editingItem} 
          dheetoId={dheeto._id} 
          onClose={() => setEditingItem(null)} 
          onUpdate={loadDheeto} 
        />
      )}
      {editingTransaction && (
        <EditTransactionModal 
          transaction={editingTransaction} 
          dheetoId={dheeto._id} 
          onClose={() => setEditingTransaction(null)} 
          onUpdate={loadDheeto} 
        />
      )}
      {showAddItem && (
        <AddItemModal 
          dheetoId={dheeto._id} 
          onClose={() => setShowAddItem(false)} 
          onUpdate={loadDheeto} 
        />
      )}
      {showAddTransaction && (
        <AddTransactionModal 
          dheetoId={dheeto._id} 
          onClose={() => setShowAddTransaction(false)} 
          onUpdate={loadDheeto} 
        />
      )}
      {showEditDheeto && (
        <EditDheetoModal 
          dheeto={dheeto} 
          onClose={() => setShowEditDheeto(false)} 
          onUpdate={loadDheeto} 
        />
      )}
    </View>
  );
}

function SummaryCard({
  title,
  items,
}: {
  title: string;
  items: {
    label: string;
    value: string | number;
    valueClass?: string;
  }[];
}) {
  return (
    <View className="mx-4 bg-blue-50 rounded-lg p-4 border border-blue-200 mt-4">
      <Text className="text-xs font-semibold text-gray-600 mb-3 text-center uppercase tracking-wide">
        {title}
      </Text>

      <View className="flex-row items-center justify-around">
        {items.map((item, index) => (
          <View key={index} className="items-center flex-1">
            <Text className="text-xs text-gray-600 mb-1">{item.label}</Text>
            <Text className={`font-bold text-base ${item.valueClass ?? "text-gray-900"}`}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}