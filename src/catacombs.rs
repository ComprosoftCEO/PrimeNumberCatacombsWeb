use num::BigUint;
use serde::Serialize;

use crate::primality_test::is_prime;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatacombNumber {
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

  pub fn is_prime(&self) -> bool {
    self.is_prime
  }

  /// Compute all of the catacomb numbers for the given input
  pub fn compute_catacombs(mut input: BigUint) -> Vec<CatacombNumber> {
    let num_bits = input.bits();

    // Toggle the bits one-by-one
    (0..=num_bits)
      .into_iter()
      .map(|bit| {
        let bit_set = input.bit(bit);
        input.set_bit(bit, !bit_set);

        let result = CatacombNumber::new(input.clone());

        input.set_bit(bit, bit_set);
        result
      })
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

    let catacombs = CatacombNumber::compute_catacombs(number);
    assert_eq!(catacombs.len(), expected.len());

    for (given, expected) in catacombs.into_iter().zip(expected) {
      assert_eq!(given.value, expected.value);
      assert_eq!(given.is_prime, expected.is_prime);
    }
  }
}
