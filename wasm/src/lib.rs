mod catacombs;
mod primality_test;
mod serialize;

pub use catacombs::CatacombNumber;
use num::{BigUint, Num};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
  pub fn alert(s: &str);
}

/// Compute all catacombs given an input number expressed in base-10
///
/// Returns `CatacombNumber[]` to the frontend
/// If there is an error, then it returns an empty array
#[wasm_bindgen(js_name = computeCatacombs)]
pub fn compute_catacombs(current_number: &str, base: u8) -> JsValue {
  let number = BigUint::from_str_radix(current_number, 10).expect("Invalid base-10 number");
  let result = CatacombNumber::compute_catacombs(&number, base);
  JsValue::from_serde(&result).expect("Failed to serialize result")
}