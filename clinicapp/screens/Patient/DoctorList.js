import { useEffect, useState, useCallback } from "react";
import { FlatList, Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Apis, { endpoints } from "../../configs/Apis";
import { Button, Card, Searchbar, List, Icon } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Header from "../../components/Header";


const DoctorList = () => {
  const navigation = useNavigation();
  const [hospital, setHospital] = useState([]);
  const [doctor, setDoctor] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [name, setName] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState(null);
  const [expandedHospital, setExpandedHospital] = useState(false);
  const [expandedSpecialization, setExpandedSpecialization] = useState(false);

  const loadHospital = async () => {
    try {
      let res = await Apis.get(endpoints["hospitals"]);
      setHospital(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDoctor = async (hospitalId = null, specializationId = null, name) => {
    try {
      let url = endpoints["doctors"] + "?";
      if (hospitalId) url += `hospital=${hospitalId}&`;
      if (specializationId) url += `specialization=${specializationId}&`;
      if (name) url += `name=${encodeURIComponent(name)}&`;

      const res = await Apis.get(url);
      setDoctor(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSpecializations = async () => {
    try {
      let res = await Apis.get(endpoints["specializations"]);
      setSpecializations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadHospital();
    loadDoctor();
    loadSpecializations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDoctor(selectedHospital, selectedSpecialization, name);
    }, 600);

    return () => clearTimeout(timer);
  }, [selectedHospital, selectedSpecialization, name]);

  const renderDoctor = useCallback((dr) => (
    <Card style={styles.cards} key={dr.id}>
      <Card.Title titleStyle={{ fontWeight: 'bold' }} title={`Bác sĩ ${dr.doctor}`} />
      <Card.Content style={styles.cardContent}>
        <Image style={styles.avatar} source={{ uri: dr.avatar }} />
        <View style={styles.doctorInfo}>
          <Text style={{ marginBottom: 10 }}>Chuyên khoa: {dr.specialization_name}</Text>
          <Text>Cơ sở: {dr.hospital_name}</Text>
          <Text style={{ paddingTop: 5 }}>Kinh nghiệm: {dr.biography}</Text>
          <Text style={{ paddingTop: 5 }}>Giá khám bệnh: {dr.consultation_fee}</Text>
          <Text onPress={() => navigation.navigate("Review", { doctor: dr })} style={{ paddingTop: 5 }}>
            {dr.total_reviews === 0
              ? 'Chưa có lượt đánh giá'
              : `Đánh giá: ${dr.average_rating}⭐ (${dr.total_reviews} lượt đánh giá)`
            }
          </Text>



        </View>
      </Card.Content>
      <Card.Actions>
        <Button mode="contained" onPress={() => navigation.navigate('Schedule', { doctor: dr })}>
          Đặt lịch khám
        </Button>
      </Card.Actions>
    </Card>
  ), [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <Header title={"Chọn bác sĩ"} />
      <List.Section>
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Lọc theo cơ sở y tế:</Text>
          <List.Accordion
            title={selectedHospital ? hospital.find(h => h.id === selectedHospital)?.name : "Tất cả cơ sở y tế"}
            left={props => <List.Icon {...props} icon="hospital-building" />}
            expanded={expandedHospital}
            onPress={() => setExpandedHospital(!expandedHospital)}
            style={styles.accordion}
          >
            <List.Item
              title="Tất cả cơ sở y tế"
              onPress={() => {
                setSelectedHospital(null);
                setExpandedHospital(false);
              }}
            />
            {hospital.map(h => (
              <List.Item
                key={h.id}
                title={h.name}
                onPress={() => {
                  setSelectedHospital(h.id);
                  setExpandedHospital(false);
                }}
              />
            ))}
          </List.Accordion>
        </View>

        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Lọc theo chuyên khoa:</Text>
          <List.Accordion
            title={selectedSpecialization ? specializations.find(s => s.id === selectedSpecialization)?.name : "Tất cả chuyên khoa"}
            left={props => <List.Icon {...props} icon="stethoscope" />}
            expanded={expandedSpecialization}
            onPress={() => setExpandedSpecialization(!expandedSpecialization)}
            style={styles.accordion}
          >
            <List.Item
              title="Tất cả chuyên khoa"
              onPress={() => {
                setSelectedSpecialization(null);
                setExpandedSpecialization(false);
              }}
            />
            {specializations.map(s => (
              <List.Item
                key={s.id}
                title={s.name}
                onPress={() => {
                  setSelectedSpecialization(s.id);
                  setExpandedSpecialization(false);
                }}
              />
            ))}
          </List.Accordion>
        </View>
      </List.Section>

      <Searchbar
        style={[styles.search, { textDecorationColor: 'black' }]}
        placeholder="Nhập tên bác sĩ cần tìm..."
        onChangeText={(value) => setName(value)}
      />

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
  cards: {
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
  search: {
    marginBottom: 10,
    backgroundColor: "#17A2F3",
  },
  accordion: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 5,
  },
});

export default DoctorList;
