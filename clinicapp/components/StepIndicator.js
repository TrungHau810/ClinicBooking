import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const StepIndicator = () => {

    const nav = useNavigation();

    return (
    <View style={styles.header}>
      {/* Back Button */}
      <TouchableOpacity onPress={nav.goBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>Chọn thông tin khám</Text>

      {/* Step Indicator */}
      <View style={styles.stepsContainer}>
        {/* Step 1: Stethoscope */}
        <View style={styles.step}>
          <View style={styles.iconCircle}>
            <FontAwesome5 name="stethoscope" size={18} color="#00BFFF" />
          </View>
        </View>

        <View style={styles.line} />

        {/* Step 2: User */}
        <View style={styles.step}>
          <MaterialIcons name="person" size={24} color="white" />
        </View>

        <View style={styles.line} />

        {/* Step 3: Check */}
        <View style={styles.step}>
          <Ionicons name="checkmark-circle" size={24} color="white" />
        </View>

        <View style={styles.line} />

        {/* Step 4: Wallet */}
        <View style={styles.step}>
          <Ionicons name="wallet" size={24} color="white" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#00BFFF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 22,
  },
  title: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  step: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
  },
  line: {
    height: 2,
    backgroundColor: 'white',
    flex: 1,
    marginHorizontal: 4,
  },
});

export default StepIndicator;
