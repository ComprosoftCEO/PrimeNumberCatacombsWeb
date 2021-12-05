use itertools::Itertools;
use num::BigUint;
use serde::Serialize;
use std::iter;

use crate::primality_test::is_prime;
use crate::serialize::serialize_to_str;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatacombNumber {
  #[serde(serialize_with = "serialize_to_str")]
  value: BigUint,
  is_prime: bool,
}

#[allow(unused)]
impl CatacombNumber {
  pub fn new(value: impl Into<BigUint>) -> Self {
    let value: BigUint = value.into();
    let is_prime = is_prime(&value);
    Self { value, is_prime }
  }

  pub fn get_value(&self) -> &BigUint {
    &self.value
  }

  pub fn into_value(self) -> BigUint {
    self.value
  }

  pub fn is_prime(&self) -> bool {
    self.is_prime
  }

  /// Compute all of the catacomb numbers for the given input
  pub fn compute_catacombs(input: &BigUint, base: u8, hamming_distance: usize) -> Vec<CatacombNumber> {
    debug_assert!(base > 1, "Base must be between 2 and 256 (given {})", base);
    debug_assert!(
      hamming_distance > 0,
      "Hamming distance must be positive (given {})",
      hamming_distance
    );

    // Convert to the base, and add the leading 0 bits
    let original_digits: Vec<u8> = input
      .to_radix_le(base as u32)
      .into_iter()
      .chain(iter::repeat(0).take(hamming_distance)) /* Append 0 bits */
      .collect();

    let mut new_digits = original_digits.clone();

    // Compute all possible combinations for the hamming distance
    (0..original_digits.len())
      .combinations(hamming_distance)
      .map(|digits_to_change| {
        // Compute all possible combinations for a given base for the digits
        digits_to_change
          .into_iter()
          .map(|digit_index| (0..base).map(move |d| (digit_index, d)))
          .multi_cartesian_product()
          .filter(|digits_to_update| {
            digits_to_update
              .iter()
              .all(|(digit_index, d)| *d != original_digits[*digit_index])
          })
          .map(|digits_to_update| {
            // Temporarily change all of the digits to the new values
            for (digit_index, d) in digits_to_update.iter() {
              new_digits[*digit_index] = *d;
            }

            let number = BigUint::from_radix_le(&new_digits, base as u32).unwrap();

            // Change all of the digits back
            for (digit_index, _) in digits_to_update.iter() {
              new_digits[*digit_index] = original_digits[*digit_index];
            }

            CatacombNumber::new(number)
          })
          .collect::<Vec<_>>()
      })
      .flatten()
      .collect()
  }
}

/// Unit testing
#[cfg(test)]
mod test {
  #[allow(unused_imports)]
  use super::*;

  #[test]
  fn test_computes_valid_outputs() {
    let number = BigUint::from(0b1101u32); /* 13 */

    let expected: Vec<_> = vec![
      (0b1100, false), /* 12 */
      (0b1111, false), /* 15 */
      (0b1001, false), /* 9 */
      (0b0101, true),  /* 5 */
      (0b11101, true), /* 29 */
    ]
    .into_iter()
    .map(|(value, is_prime): (u32, bool)| CatacombNumber {
      value: BigUint::from(value),
      is_prime,
    })
    .collect();

    let catacombs = CatacombNumber::compute_catacombs(&number, 2, 1);
    assert_eq!(catacombs.len(), expected.len());

    for (given, expected) in catacombs.into_iter().zip(expected) {
      assert_eq!(given.value, expected.value);
      assert_eq!(given.is_prime, expected.is_prime);
    }
  }

  #[test]
  fn test_hamming_distance() {
    let number = BigUint::from(0b1101u32); /* 13 */

    let expected: Vec<_> = vec![
      (0b001110, false), /* ----xx 14 */
      (0b001000, false), /* ---x-x 8  */
      (0b000100, false), /* --x--x 4  */
      (0b011100, false), /* -x---x 28 */
      (0b101100, false), /* x----x 44 */
      (0b001011, true),  /* ---xx- 11 */
      (0b000111, true),  /* --x-x- 7  */
      (0b011111, true),  /* -x--x- 31 */
      (0b101111, true),  /* x---x- 47 */
      (0b000001, false), /* --xx-- 1  */
      (0b011001, false), /* -x-x-- 25 */
      (0b101001, true),  /* x--x-- 41 */
      (0b010101, false), /* -xx--- 21 */
      (0b100101, true),  /* x-x--- 37 */
      (0b111101, true),  /* xx---- 61 */
    ]
    .into_iter()
    .map(|(value, is_prime): (u32, bool)| CatacombNumber {
      value: BigUint::from(value),
      is_prime,
    })
    .collect();

    let catacombs = CatacombNumber::compute_catacombs(&number, 2, 2);
    assert_eq!(catacombs.len(), expected.len());

    for (given, expected) in catacombs.into_iter().zip(expected) {
      assert_eq!(given.value, expected.value);
      assert_eq!(given.is_prime, expected.is_prime);
    }
  }
}
