// app/(tabs)/home/dheeto/add-dheeto.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from "react-native";
import { X, ChevronLeft } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createDheeto } from "@/lib/api/api_providers";
import { CreateDheetoBody } from "@/lib/types";

export default function AddDheetoPage() {
  const { personId, personName } = useLocalSearchParams<{ personId: string; personName: string }>();
  const router = useRouter();

  const [dheeto, setDheeto] = useState({
    items: [] as any[],
    transactions: [] as any[],
    desc: "",
  });
  const [currentItem, setCurrentItem] = useState({
    name: "",
    type: "gold" as "gold" | "silver",
    purity: "24",
    weightInTola: "",
    desc: "",
  });
  const [currentTransaction, setCurrentTransaction] = useState({
    type: "gave" as "gave" | "received",
    amount: "",
    desc: "",
  });
  const [activeSection, setActiveSection] = useState<"items" | "transactions">("items");
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    if (currentItem.name && currentItem.weightInTola) {
      setDheeto((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            name: currentItem.name,
            type: currentItem.type,
            purity: parseFloat(currentItem.purity) || 0,
            weightInTola: parseFloat(currentItem.weightInTola) || 0,
            desc: currentItem.desc,
          },
        ],
      }));
      setCurrentItem({ name: "", type: "gold", purity: "", weightInTola: "", desc: "" });
    }
  };

  const addTransaction = () => {
    if (currentTransaction.amount) {
      setDheeto((prev) => ({
        ...prev,
        transactions: [
          ...prev.transactions,
          {
            type: currentTransaction.type,
            amount: parseFloat(currentTransaction.amount) || 0,
            desc: currentTransaction.desc,
          },
        ],
      }));
      setCurrentTransaction({ type: "gave", amount: "", desc: "" });
    }
  };

  const removeItem = (index: number) => {
    setDheeto((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const removeTransaction = (index: number) => {
    setDheeto((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (dheeto.items.length === 0) {
      Alert.alert("Missing Items", "Please add at least one item to the dheeto");
      return;
    }

    if (!personId) {
      Alert.alert("Error", "Person ID is missing");
      return;
    }

    try {
      setSaving(true);

      const dheetoData: CreateDheetoBody = {
        personId: personId,
        initialItems: dheeto.items,
        initialTransactions: dheeto.transactions,
        desc: dheeto.desc,
      };

      const response = await createDheeto(dheetoData);

      if (response.success) {
        Alert.alert("Success", "Dheeto created successfully", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert("Error", response.message || "Failed to create dheeto");
      }
    } catch (error: any) {
      console.error("Error creating dheeto:", error);
      Alert.alert("Error", error.message || "Failed to create dheeto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 pt-12 pb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 active:bg-gray-100 rounded-full" activeOpacity={0.7} disabled={saving}>
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-800">New Dheeto</Text>
          <TouchableOpacity onPress={handleSave} className="bg-blue-600 px-4 py-2 rounded-full active:bg-blue-700" activeOpacity={0.8} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text className="text-white font-semibold text-xl">Save</Text>}
          </TouchableOpacity>
        </View>
        <Text className="text-sm text-gray-500 text-center">For {personName}</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Description */}
        <View className="mx-4 mt-4">
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-3 text-gray-800 min-h-[80px]"
              placeholder="e.g., Wedding jewelry set, Custom order..."
              value={dheeto.desc}
              onChangeText={(text) => setDheeto((prev) => ({ ...prev, desc: text }))}
              multiline
              textAlignVertical="top"
              editable={!saving}
            />
          </View>
        </View>

        {/* Section Tabs */}
        <View className="mx-4 mt-4">
          <View className="bg-white rounded-2xl p-2 flex-row border border-gray-100">
            <TouchableOpacity
              onPress={() => setActiveSection("items")}
              className={`flex-1 py-3 rounded-xl ${activeSection === "items" ? "bg-amber-600" : "bg-transparent"}`}
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text className={`text-center font-semibold ${activeSection === "items" ? "text-white" : "text-gray-600"}`}>Items ({dheeto.items.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveSection("transactions")}
              className={`flex-1 py-3 rounded-xl ${activeSection === "transactions" ? "bg-blue-600" : "bg-transparent"}`}
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text className={`text-center font-semibold ${activeSection === "transactions" ? "text-white" : "text-gray-600"}`}>Transactions ({dheeto.transactions.length})</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Items Section */}
        {activeSection === "items" && (
          <View className="mx-4 mt-4">
            {/* Add Item Form */}
            <View className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 mb-4 border-2 border-amber-200">
              <Text className="text-base font-bold text-amber-900 mb-3">Add Item</Text>

              {/* Gold or silver */}
              <View className="flex-row gap-2 mb-3">
                <TouchableOpacity
                  onPress={() => setCurrentItem((prev) => ({ ...prev, type: "gold" }))}
                  className={`flex-1 p-4 rounded-xl border-2 ${currentItem.type === "gold" ? "bg-yellow-100 border-yellow-500" : "bg-white border-amber-200"}`}
                  activeOpacity={0.7}
                  disabled={saving}
                >
                  <Text className={`text-center font-semibold ${currentItem.type === "gold" ? "text-yellow-700" : "text-gray-600"}`}>🟡 Gold</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCurrentItem((prev) => ({ ...prev, type: "silver" }))}
                  className={`flex-1 p-4 rounded-xl border-2 ${currentItem.type === "silver" ? "bg-gray-200 border-gray-500" : "bg-white border-amber-200"}`}
                  activeOpacity={0.7}
                  disabled={saving}
                >
                  <Text className={`text-center font-semibold ${currentItem.type === "silver" ? "text-gray-700" : "text-gray-600"}`}>⚪ Silver</Text>
                </TouchableOpacity>
              </View>

              {/* Description */}
              <View className="mb-4">
                <Text className="text-m font-semibold text-gray-700 mb-2">Item Name</Text>
                <TextInput
                  className="bg-white rounded-2xl p-4 text-lg text-gray-800 border border-amber-300"
                  placeholder="e.g., Gold Ring"
                  value={currentItem.name}
                  onChangeText={(text) => setCurrentItem((prev) => ({ ...prev, name: text }))}
                  editable={!saving}
                />
              </View>

              <View className="flex-row gap-2 mb-3">
                <View className="flex-1">
                  <Text className="text-xs text-amber-700 mb-1 ml-1 font-medium">Purity (ct)</Text>
                  <TextInput
                    className="bg-white rounded-xl p-3 text-gray-800 border border-amber-200"
                    keyboardType="decimal-pad"
                    value={currentItem.purity}
                    onChangeText={(text) => setCurrentItem((prev) => ({ ...prev, purity: text }))}
                    editable={!saving}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-amber-700 mb-1 ml-1 font-medium">Weight (tola)</Text>
                  <TextInput
                    className="bg-white rounded-xl p-3 text-gray-800 border border-amber-200"
                    keyboardType="decimal-pad"
                    value={currentItem.weightInTola}
                    onChangeText={(text) => setCurrentItem((prev) => ({ ...prev, weightInTola: text }))}
                    editable={!saving}
                  />
                </View>
              </View>

              <TextInput
                className="bg-white rounded-xl p-3 mb-3 text-gray-800 border border-amber-200"
                placeholder="Additional notes (optional)"
                value={currentItem.desc}
                onChangeText={(text) => setCurrentItem((prev) => ({ ...prev, desc: text }))}
                editable={!saving}
              />

              <TouchableOpacity onPress={addItem} className="bg-amber-600 p-4 rounded-xl active:bg-amber-700" activeOpacity={0.8} disabled={saving}>
                <Text className="text-white font-bold text-center">Add Item</Text>
              </TouchableOpacity>
            </View>

            {/* Items List */}
            {dheeto.items.length > 0 && (
              <View className="bg-white rounded-2xl p-4 border border-gray-100">
                <Text className="text-base font-bold text-gray-900 mb-3">Added Items ({dheeto.items.length})</Text>
                {dheeto.items.map((item, index) => (
                  <View key={index} className="bg-gray-50 rounded-xl p-3 mb-2">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-lg">{item.type === "gold" ? "🟡" : "⚪"}</Text>
                          <Text className="font-bold text-gray-900">{item.name}</Text>
                        </View>
                        <Text className="text-sm text-gray-600 ml-7">
                          {item.purity}% purity • {item.weightInTola} tola
                        </Text>
                        {item.desc && <Text className="text-xs text-gray-500 mt-1 ml-7">{item.desc}</Text>}
                      </View>
                      <TouchableOpacity onPress={() => removeItem(index)} className="p-1.5 active:bg-red-100 rounded" activeOpacity={0.7} disabled={saving}>
                        <X size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Transactions Section */}
        {activeSection === "transactions" && (
          <View className="mx-4 mt-4 mb-6">
            {/* Add Transaction Form */}
            <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-4 border-2 border-blue-200">
              <Text className="text-base font-bold text-blue-900 mb-3">Add Transaction</Text>

              <View className="flex-row gap-2 mb-3">
                <TouchableOpacity
                  onPress={() => setCurrentTransaction((prev) => ({ ...prev, type: "gave" }))}
                  className={`flex-1 p-4 rounded-xl border-2 ${currentTransaction.type === "gave" ? "bg-red-100 border-red-500" : "bg-white border-blue-200"}`}
                  activeOpacity={0.7}
                  disabled={saving}
                >
                  <Text className={`text-center font-semibold ${currentTransaction.type === "gave" ? "text-red-700" : "text-gray-600"}`}>↓ Gave</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCurrentTransaction((prev) => ({ ...prev, type: "received" }))}
                  className={`flex-1 p-4 rounded-xl border-2 ${currentTransaction.type === "received" ? "bg-green-100 border-green-500" : "bg-white border-blue-200"}`}
                  activeOpacity={0.7}
                  disabled={saving}
                >
                  <Text className={`text-center font-semibold ${currentTransaction.type === "received" ? "text-green-700" : "text-gray-600"}`}>↑ Received</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                className="bg-white rounded-xl p-3 mb-3 text-gray-800 border border-blue-200"
                placeholder="Amount (₹)"
                keyboardType="numeric"
                value={currentTransaction.amount}
                onChangeText={(text) => setCurrentTransaction((prev) => ({ ...prev, amount: text }))}
                editable={!saving}
              />

              <TextInput
                className="bg-white rounded-xl p-3 mb-3 text-gray-800 border border-blue-200"
                placeholder="Description (optional)"
                value={currentTransaction.desc}
                onChangeText={(text) => setCurrentTransaction((prev) => ({ ...prev, desc: text }))}
                editable={!saving}
              />

              <TouchableOpacity onPress={addTransaction} className="bg-blue-600 p-4 rounded-xl active:bg-blue-700" activeOpacity={0.8} disabled={saving}>
                <Text className="text-white font-bold text-center">Add Transaction</Text>
              </TouchableOpacity>
            </View>

            {/* Transactions List */}
            {dheeto.transactions.length > 0 && (
              <View className="bg-white rounded-2xl p-4 border border-gray-100">
                <Text className="text-base font-bold text-gray-900 mb-3">Added Transactions ({dheeto.transactions.length})</Text>
                {dheeto.transactions.map((transaction, index) => (
                  <View key={index} className="bg-gray-50 rounded-xl p-3 mb-2">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <View className={`px-2 py-1 rounded-full ${transaction.type === "gave" ? "bg-red-100" : "bg-green-100"}`}>
                            <Text className={`text-xs font-bold ${transaction.type === "gave" ? "text-red-700" : "text-green-700"}`}>
                              {transaction.type === "gave" ? "↓ GAVE" : "↑ RECEIVED"}
                            </Text>
                          </View>
                          <Text className="font-bold text-gray-900 text-lg">₹{transaction.amount.toLocaleString()}</Text>
                        </View>
                        {transaction.desc && <Text className="text-sm text-gray-600 ml-2">{transaction.desc}</Text>}
                      </View>
                      <TouchableOpacity onPress={() => removeTransaction(index)} className="p-1.5 active:bg-red-100 rounded" activeOpacity={0.7} disabled={saving}>
                        <X size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Transaction Summary */}
                <View className="bg-blue-50 rounded-xl p-3 mt-2 border border-blue-200">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-xs text-gray-600 mb-1">Total Gave</Text>
                      <Text className="text-red-600 font-bold">
                        ₹
                        {dheeto.transactions
                          .filter((t) => t.type === "gave")
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString()}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-xs text-gray-600 mb-1">Total Received</Text>
                      <Text className="text-green-600 font-bold">
                        ₹
                        {dheeto.transactions
                          .filter((t) => t.type === "received")
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString()}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-xs text-gray-600 mb-1">Balance</Text>
                      <Text
                        className={`font-bold ${
                          dheeto.transactions.filter((t) => t.type === "received").reduce((sum, t) => sum + t.amount, 0) -
                            dheeto.transactions.filter((t) => t.type === "gave").reduce((sum, t) => sum + t.amount, 0) >=
                          0
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        ₹
                        {Math.abs(
                          dheeto.transactions.filter((t) => t.type === "received").reduce((sum, t) => sum + t.amount, 0) -
                            dheeto.transactions.filter((t) => t.type === "gave").reduce((sum, t) => sum + t.amount, 0)
                        ).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
