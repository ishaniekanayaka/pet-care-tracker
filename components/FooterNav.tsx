import { View, Text, Pressable } from "react-native"
import React from "react"
import { useRouter, useSegments } from "expo-router"

const tabs = [
  { lable: "Home", path: "/home" },
  { lable: "Project", path: "/project" },
  { lable: "User", path: "/user" }
] as const

const FooterNav = () => {
  const router = useRouter()

  const segment = useSegments() // ["project"]
  const activeRouter = "/" + (segment[0] || "")

  return (
    <View className="flex-row justify-around border-gray-300 py-2 bg-white">
      {/* {tabs.map(() => {
        return <View></View>
      })} */}
      {tabs.map((data) => (
        <Pressable
          // data.path === activeRouter -> this button is active
          //   "" + "" -> ` ${can use varibles like any} `
          className={`py-1 px-4 rounded-lg ${data?.path === activeRouter ? "bg-blue-600" : ""}`}
          onPress={() => {
            router.push(data?.path)
          }}
        >
          <Text className="text-2xl">{data?.lable}</Text>
        </Pressable>
      ))}
    </View>
  )
}

export default FooterNav
