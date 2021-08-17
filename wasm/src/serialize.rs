#![allow(unused)]

use std::fmt::Display;
use std::str::FromStr;
use std::string::ToString;

use serde::de::{self, Deserialize, Deserializer};
use serde::ser::Serializer;
/// Serialize a normal value to a string
pub fn serialize_to_str<T, S>(value: &T, serializer: S) -> Result<S::Ok, S::Error>
where
  T: ToString,
  S: Serializer,
{
  let s = value.to_string();
  serializer.serialize_str(&s)
}

/// Deserialize a normal value from a string
pub fn deserialize_from_str<'de, T, D>(deserializer: D) -> Result<T, D::Error>
where
  T: FromStr,
  T::Err: Display,
  D: Deserializer<'de>,
{
  let s = String::deserialize(deserializer)?;
  T::from_str(&s).map_err(de::Error::custom)
}

/// Serialize an optional value to a string
pub fn serialize_to_str_option<T, S>(value: &Option<T>, serializer: S) -> Result<S::Ok, S::Error>
where
  T: ToString,
  S: Serializer,
{
  match value {
    Some(value) => {
      let s = value.to_string();
      serializer.serialize_str(&s)
    },
    None => serializer.serialize_none(),
  }
}

/// Deserialize a normal value from a string
pub fn deserialize_from_str_option<'de, T, D>(deserializer: D) -> Result<Option<T>, D::Error>
where
  T: FromStr,
  T::Err: Display,
  D: Deserializer<'de>,
{
  let s = Option::<String>::deserialize(deserializer)?;
  match s {
    Some(s) => Ok(Some(T::from_str(&s).map_err(de::Error::custom)?)),
    None => Ok(None),
  }
}
