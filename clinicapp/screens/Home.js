// import { useEffect, useState } from "react";
// import { FlatList, Image, ScrollView, TouchableOpacity, View } from "react-native";
// import { Button, List, Text } from "react-native-paper";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Apis, { endpoints } from "../configs/Apis";



// const Home = ({ navigation }) => {

//     const [hospital, setHospital] = useState([]);

//     const loadingHospital = async () => {
//         let res = await Apis.get(endpoints['hospitals']);
//         setHospital(res.data);
//     }

//     useEffect(() => {
//         loadingHospital();
//     }, []);


//     return (
//         <SafeAreaView>
//             <Text>Chào mừng đến TH Care </Text>
//             <View>
//                 <Button mode="contained" onPress={() => navigation.navigate('doctorbooking')}>Đặt khám bác sĩ</Button>
//             </View>

//             {/* <TouchableOpacity onPress={navigation.navigate('profile')}>
//                 <Button mode="contained">Đặt lịch khám</Button>
//             </TouchableOpacity> */}
//             <FlatList data={hospital} renderItem={({ item }) => (
//                 <TouchableOpacity onPress={()=> {navigation.navigate('hospitaldetails', {'hospitalId': item.id})}}>
//                     <List.Item
//                         title={item.name}
//                         description={`${item.address} \n ${item.phone}`}
//                         left={() => <Image style={{ width: 50, height: 50, borderRadius: 8, marginRight: 10 }} source={{ uri: item.image }} />} />
//                 </TouchableOpacity>
//             )} />

//            <TouchableOpacity onPress={()=>navigation.navigate('')}><Button>Đặt lịch khám bệnh</Button></TouchableOpacity>

//         </SafeAreaView>
//     );
// }

// export default Home;


import { useEffect, useState } from "react";
import { FlatList, Image, TouchableOpacity, View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { Button, Card, List, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Apis, { endpoints } from "../configs/Apis";
import Carousel from 'react-native-reanimated-carousel';

const Home = ({ navigation }) => {
  const [hospital, setHospital] = useState([]);
  const [specialization, setSpecialization] = useState([]);
  const { width } = Dimensions.get('window');

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
    console.log("Image URL:", item.logo);

    return (
      <TouchableOpacity
        style={[styles.hospitalItem, styles.recordBox]}
        onPress={() => navigation.navigate('hospitaldetails', { hospitalId: item.id })}
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
      <ScrollView>
        <Text style={styles.header}>Chào mừng đến TH Care</Text>
        <View>
          <ImageSlider />
        </View>
        <Card.Actions>
          <View style={styles.button}>
            <Button
              mode="contained"
              style={styles.actionButton}
              onPress={() => navigation.navigate('doctorList')}
              labelStyle={styles.buttonLabel}
            >
              Đặt khám bác sĩ
            </Button>
          </View>
        </Card.Actions>

        {/* <FlatList
          data={hospital}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderHospitalItem}
          contentContainerStyle={styles.listContainer}
          style={styles.p}
        /> */}

        {Array.isArray(hospital) && hospital.map((item, index) => (
          <View key={index} style={styles.p}>
            {renderHospitalItem({ item })}
          </View>
        ))}

        {/* {specialization.map(s => <Text key={s.id}>{s.name}</Text>)} */}
      </ScrollView>
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
});

export default Home;
