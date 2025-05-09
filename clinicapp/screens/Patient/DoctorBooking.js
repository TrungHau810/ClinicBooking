// import { useEffect, useState } from "react";
// import { FlatList, Image, Text, View } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Apis, { endpoints } from "../../configs/Apis";
// import { Button, Card, List } from "react-native-paper";
// import { Picker } from "@react-native-picker/picker";

// const DoctorBooking = () => {
//     const [hospital, setHospital] = useState([]);
//     const [doctor, setDoctor] = useState([]);

//     const loadingHospital = async () => {
//         let res = await Apis.get(endpoints['hospitals']);
//         setHospital(res.data);
//     }

//     const loadDoctor = async () => {
//         let res = await Apis.get(endpoints['doctors']);
//         console.log(res.data);
//         setDoctor(res.data);
//     };

//     useEffect(() => {
//         loadDoctor();
//     }, []);

//     useEffect(() => {
//         loadingHospital();
//     }, []);

//     const renderDoctor = (dr) => (
//         <Card>
//             <Card.Title title={`Bác sĩ ${dr.last_name} ${dr.first_name}`}></Card.Title>
//             <Card.Content>
//                 <View><Image
//                     style={{ height: 50, width: 50, borderRadius: 50 }}
//                     source={{ uri: dr.avatar }}
//                 /></View>
//                 <Text >Bác sĩ {dr.last_name} {dr.first_name}</Text>
//                 <Text >Chuyên khoa: {dr.specialization_name}</Text>

//             </Card.Content>
//             <Card.Actions>
//                 <Button>Đặt lịch khám</Button>
//             </Card.Actions>
//         </Card>
//     );

//     return (
//         <SafeAreaView>
//             <Text>Danh sách bác sĩ</Text>
//             <View>
//                 <Text>Lọc theo:</Text>
//                 <Picker>
//                     <Picker.Item key='CSYT' label="Cơ sở y tế" />
//                     {hospital.map(h => <Picker.Item key={h.id} label={h.name} />)}
//                 </Picker>
//             </View>
//             <FlatList data={doctor} renderItem={({ item }) => (renderDoctor(item))} />
//         </SafeAreaView>);
// };

// export default DoctorBooking;


import { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Apis, { endpoints } from "../../configs/Apis";
import { Button, Card } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";

const DoctorBooking = () => {
  const [hospital, setHospital] = useState([]);
  const [doctor, setDoctor] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);

  const loadHospital = async () => {
    try {
      let res = await Apis.get(endpoints["hospitals"]);
      setHospital(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDoctor = async (hospitalId = null) => {
    try {
      let res;
      if (hospitalId) {
        res = await Apis.get(endpoints["doctors"] + `?hospital_id=${hospitalId}`);
      } else {
        res = await Apis.get(endpoints["doctors"]);
      }
      setDoctor(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadHospital();
    loadDoctor();
  }, []);

  useEffect(() => {
    loadDoctor(selectedHospital);
  }, [selectedHospital]);

  const renderDoctor = (dr) => (
    <Card style={styles.card} key={dr.id}>
      <Card.Title title={`Bác sĩ ${dr.last_name} ${dr.first_name}`} />
      <Card.Content style={styles.cardContent}>
        <Image
          style={styles.avatar}
          source={{ uri: dr.avatar }}
        />
        <View style={styles.doctorInfo}>
          <Text>Chuyên khoa: {dr.specialization_name}</Text>
          <Text>Cơ sở: {dr.hospital_name}</Text>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button mode="contained">Đặt lịch khám</Button>
      </Card.Actions>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Danh sách bác sĩ</Text>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Lọc theo cơ sở y tế:</Text>
        <Picker
          selectedValue={selectedHospital}
          onValueChange={(value) => setSelectedHospital(value)}
          style={styles.picker}
        >
          <Picker.Item label="Tất cả cơ sở y tế" value={null} />
          {hospital.map((h) => (
            <Picker.Item key={h.id} label={h.name} value={h.id} />
          ))}
        </Picker>
      </View>

      <FlatList
        data={doctor}
        renderItem={({ item }) => renderDoctor(item)}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  picker: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },
  card: {
    marginBottom: 16,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  list: {
    paddingBottom: 20,
  },
});

export default DoctorBooking;
