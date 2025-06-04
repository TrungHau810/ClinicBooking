import { useEffect, useState } from "react";
import { FlatList, Image, TouchableOpacity, View, StyleSheet, Dimensions, ScrollView, StatusBar } from "react-native";
import { Button, Card, List, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Apis, { endpoints } from "../configs/Apis";
import Carousel from 'react-native-reanimated-carousel';
import MyStyles from "../styles/MyStyles";
import { useNavigation } from "@react-navigation/native";

const Home = () => {
  const [hospital, setHospital] = useState([]);
  const [specialization, setSpecialization] = useState([]);
  const { width } = Dimensions.get('window');
  const nav = useNavigation();

  const imageList = [
    require('../assets/home1.jpg'),
    require('../assets/home2.jpg'),
    require('../assets/home3.jpg'),
  ];

  const ImageSlider = () => {
    return (
      <View style={{ height: 200, marginBottom: 20 }}>
        <Carousel
          loop
          autoPlay
          data={imageList}
          scrollAnimationDuration={1500}
          width={width}
          height={200}
          renderItem={({ item }) => (
            <Image
              source={item}
              style={{ width: '100%', height: 200, resizeMode: 'cover' }}
            />
          )}
        />
      </View>
    );
  };


  const loadSpecialization = async () => {
    let res = await Apis.get(endpoints['specializations']);
    setSpecialization(res.data);
  };

  const loadingHospital = async () => {
    try {
      const res = await Apis.get(endpoints['hospitals']);
      setHospital(res.data);
    } catch (err) {
      console.error("Failed to load hospitals:", err);
    }
  };

  useEffect(() => {
    loadingHospital();
  }, []);

  useEffect(() => {
    loadSpecialization();
  }, [])

  const renderHospitalItem = ({ item }) => {

    return (
      <TouchableOpacity
        style={[styles.hospitalItem, styles.recordBox]}
        onPress={() => nav.navigate('HospitalDetail', { hospitalId: item.id })}
      >
        <Image source={{ uri: item.logo }} style={styles.hospitalImage} />
        <View style={styles.hospitalInfo}>
          <Text style={styles.hospitalName}>{item.name}</Text>
          <Text style={styles.hospitalDesc}>{`Địa chỉ: ${item.address}`}</Text>
          <Text style={styles.hospitalPhone}>{`Hotline: ${item.phone}`}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <StatusBar barStyle="light-content" backgroundColor="#1E90FF" />
        <View style={styles.headerContainer}>
          <Text style={{ fontSize: 22, color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
            Chào mừng đến Open Care
          </Text>
        </View>
        <View>
          <ImageSlider />
        </View>

        <List.Item onPress={() => { console.log("Hiện") }} title='Test' description="Không biết" left={() => <List.Icon icon={'folder'} />} />
        <List.Item onPress={() => { console.log("Hiện") }} title='Test' description="Không biết" left={() => <List.Icon icon={'folder'} />} />
        <List.Item onPress={() => { console.log("Hiện") }} title='Test' description="Không biết" left={() => <List.Icon icon={'folder'} />} />
        <List.Item onPress={() => { console.log("Hiện") }} title='Test' description="Không biết" left={() => <List.Icon icon={'folder'} />} />
       
        <Card.Actions>
          <View style={styles.button}>
            <Button
              mode="contained"
              style={styles.actionButton}
              onPress={() => nav.navigate('DoctorList')}
              labelStyle={styles.buttonLabel}
            >
              Đặt khám bác sĩ
            </Button>
          </View>
        </Card.Actions>

        {Array.isArray(hospital) && hospital.map((item, index) => (
          <View key={index} style={styles.p}>
            {renderHospitalItem({ item })}
          </View>
        ))}
      </ScrollView>
      <Button mode="contained" onPress={() => nav.navigate("UserList")}>Nhắn tin</Button>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
    color: "#2c3e50",
  },
  actionButton: {
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#17A2F3",
    height: 50,
    width: 250,
    justifyContent: 'center'
  },
  hospitalItem: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  hospitalImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  hospitalInfo: {
    flex: 1,
    justifyContent: "center",
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  hospitalDesc: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  hospitalPhone: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  bottomButton: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 8
  },
  recordBox: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingBottom: 1,
    paddingTop: 7,
  },
  button: {
    alignItems: 'center',
    flex: 1
  },
  buttonLabel: {
    fontSize: 20,
  },
  p: {
    paddingHorizontal: 16,
  },
  headerContainer: {
    width: '100%',
    backgroundColor: '#1E90FF',
    paddingVertical: 20,
    //paddingHorizontal: 16,
  },
});

export default Home;
