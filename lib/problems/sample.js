/**
 * 各クラスの最小口数定義
 */
const MIN_KUCHI = {
    '1A': 2,
    '1B': 2,
    '1C': 2,
    '1D': 2,
    '1E': 2,
    '1F': 2,
    '2A': 2,
    '2B': 3,
    '3A': 2,
    '3B': 3,
    '3C': 2,
    '3D': 3,
    '3E': 5
  };
  
  /**
   * 各クラスの最大口数定義
   */
  const MAX_KUCHI = {
    '1A': 4,
    '1B': 100,
    '1C': 100,
    '1D': 100,
    '1E': 100,
    '1F': 100,
    '2A': 100,
    '2B': 100,
    '3A': 100,
    '3B': 100,
    '3C': 100,
    '3D': 100,
    '3E': 100
  };
  
  /**
   * そろばん問題生成関数
   * @param {string} classType - クラスタイプ ('1A', '1B', '1C', '1D', '1E', '1F', '2A', '2B', '3A', '3B', '3C', '3D', '3E')
   * @param {number} kuchi - 口数
   * @returns {object} - { problem: string, answer: number, steps: array }
   */
  function generateSorobanProblem(classType, kuchi) {
    const minKuchi = MIN_KUCHI[classType];
    const maxKuchi = MAX_KUCHI[classType];
    
    if (!minKuchi || !maxKuchi) {
      throw new Error(`未対応のクラスタイプ: ${classType}`);
    }
    
    if (kuchi < minKuchi) {
      throw new Error(`${classType}クラスは最低${minKuchi}口必要です（指定: ${kuchi}口）`);
    }
    
    if (kuchi > maxKuchi) {
      throw new Error(`${classType}クラスは最大${maxKuchi}口です（指定: ${kuchi}口）`);
    }
    
    const candidateGenerators = {
      '1A': getCandidates1A,
      '1B': getCandidates1B,
      '1C': getCandidates1C,
      '1D': getCandidates1D,
      '1E': getCandidates1E,
      '1F': getCandidates1F,
      '2A': getCandidates2A,
      '2B': getCandidates2B,
      '3A': getCandidates3A,
      '3B': getCandidates3B,
      '3C': getCandidates3C,
      '3D': getCandidates3D,
      '3E': getCandidates3E
    };
  
    const getCandidates = candidateGenerators[classType];
  
    let attempts = 0;
    const maxAttempts = 1000;
  
    while (attempts < maxAttempts) {
      attempts++;
      
      const result = generateProblemAttempt(kuchi, getCandidates, classType);
      
      if (result && validateProblem(result, classType)) {
        return result;
      }
    }
  
    throw new Error(`${maxAttempts}回試行しても有効な問題を生成できませんでした。`);
  }
  
  /**
   * 問題生成の1回の試行
   */
  function generateProblemAttempt(kuchi, getCandidates, classType) {
    const numbers = [];
    const steps = [];
    let current = 0;
  
    const firstCandidates = getCandidates(0, true);
    if (firstCandidates.length === 0) return null;
    
    const firstNum = firstCandidates[Math.floor(Math.random() * firstCandidates.length)];
    numbers.push(firstNum);
    current = firstNum;
    steps.push(current);
  
    const maxValue = classType.startsWith('3') ? 19 : 9;
  
    for (let i = 1; i < kuchi; i++) {
      // currentを1桁目（0-19）に正規化して候補を取得
      const normalizedCurrent = normalizeToSingleDigit(current);
      const candidates = getCandidates(normalizedCurrent, false);
      if (candidates.length === 0) return null;
  
      const nextNum = candidates[Math.floor(Math.random() * candidates.length)];
      numbers.push(nextNum);
      current += nextNum;
      
      if (current < 0 || current > maxValue) return null;
      
      steps.push(current);
    }
  
    return {
      numbers: numbers,
      problem: formatProblem(numbers),
      answer: current,
      steps: steps
    };
  }
  
  /**
   * 数値を1桁目（0-19の範囲）に正規化
   * 20以上の場合は10の位を無視して0-19の範囲に変換
   * 例: 27 → 17, 35 → 15
   */
  function normalizeToSingleDigit(num) {
    if (num >= 20) {
      return 10 + (num % 10);
    }
    return num;
  }
  
  /**
   * 問題を文字列形式にフォーマット
   */
  function formatProblem(numbers) {
    let result = numbers[0].toString();
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] >= 0) {
        result += ' + ' + numbers[i];
      } else {
        result += ' - ' + Math.abs(numbers[i]);
      }
    }
    return result;
  }
  
  // ========== 1A：1玉の加算のみ（答えが4以下）==========
  /**
   * クラス1A: 1玉の加算のみ
   * - 使える数字: 0〜4
   * - 演算: 加算（+）のみ
   * - 答えの範囲: 0〜4
   */
  function getCandidates1A(current, isFirst) {
    if (isFirst) {
      return [1, 2, 3, 4];
    }
    
    switch (current) {
      case 0: return [1, 2, 3, 4];
      case 1: return [1, 2, 3];
      case 2: return [1, 2];
      case 3: return [1];
      case 4: return [];
      default: return [];
    }
  }
  
  // ========== 1B：1玉の加減算（途中も答えも0〜4）==========
  /**
   * クラス1B: 1玉の加減算
   * - 使える数字: 0〜4
   * - 演算: 加算（+）、減算（-）
   * - 途中経過: 常に0〜4の範囲
   * - 答えの範囲: 0〜4
   */
  function getCandidates1B(current, isFirst) {
    if (isFirst) {
      return [1, 2, 3, 4];
    }
    
    switch (current) {
      case 0: return [1, 2, 3, 4];
      case 1: return [-1, 1, 2, 3];
      case 2: return [-2, -1, 1, 2];
      case 3: return [-3, -2, -1, 1];
      case 4: return [-4, -3, -2, -1];
      default: return [];
    }
  }
  
  // ========== 1C：5玉の加減算追加（問題文に6〜9使わない、1玉計算5未満）==========
  /**
   * クラス1C: 5玉の加減算を追加
   * - 使える数字: 問題文には0〜5のみ（6〜9は使わない）
   * - 演算: 加算（+）、減算（-）
   * - 1玉計算の制約: 1玉同士の計算が5以上にならない
   * - 答えの範囲: 0〜9
   */
  function getCandidates1C(current, isFirst) {
    if (isFirst) {
      return [1, 2, 3, 4, 5];
    }
    
    switch (current) {
      case 0: return [1, 2, 3, 4, 5];
      case 1: return [-1, 1, 2, 3, 5];
      case 2: return [-2, -1, 1, 2, 5];
      case 3: return [-3, -2, -1, 1, 5];
      case 4: return [-4, -3, -2, -1, 5];
      case 5: return [-5, 1, 2, 3, 4];
      case 6: return [-5, -1, 1, 2, 3];
      case 7: return [-5, -2, -1, 1, 2];
      case 8: return [-5, -3, -2, -1, 1];
      case 9: return [-5, -4, -3, -2, -1];
      default: return [];
    }
  }
  
  // ========== 1D：6〜9の加算を条件付きで追加（先頭or途中が0の時のみ）==========
  /**
   * クラス1D: 6〜9の加算を条件付きで追加
   * - 使える数字: 0〜9（ただし条件付き）
   * - 6〜9が使える条件:
   *   - 先頭（最初の数）として加算のみ使える
   *   - または途中の計算結果が0になった直後に加算のみ使える
   * - 6〜9の減算は不可
   * - 演算: 加算（+）、減算（-）※ただし6〜9は加算のみ
   * - 1玉計算の制約: 1玉同士の計算が5以上にならない
   * - 答えの範囲: 0〜9
   */
  function getCandidates1D(current, isFirst) {
    if (isFirst) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
    
    switch (current) {
      case 0: return [1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 1: return [-1, 1, 2, 3, 5];
      case 2: return [-2, -1, 1, 2, 5];
      case 3: return [-3, -2, -1, 1, 5];
      case 4: return [-4, -3, -2, -1, 5];
      case 5: return [-5, 1, 2, 3, 4];
      case 6: return [-5, -1, 1, 2, 3];
      case 7: return [-5, -2, -1, 1, 2];
      case 8: return [-5, -3, -2, -1, 1];
      case 9: return [-5, -4, -3, -2, -1];
      default: return [];
    }
  }
  
  // ========== 1E：6〜9の加算を自由に追加（6〜9は加算のみ）==========
  /**
   * クラス1E: 6〜9の加算を自由に追加
   * - 使える数字: 0〜9
   * - 6〜9の使用条件:
   *   - 加算（+）のみ使える
   *   - 減算（-）は不可
   *   - どこでも自由に加算できる（先頭や途中が0という制限なし）
   * - 演算: 加算（+）、減算（-）※ただし6〜9は加算のみ
   * - 1玉計算の制約: 1玉同士の計算が5以上にならない
   * - 答えの範囲: 0〜9
   */
  function getCandidates1E(current, isFirst) {
    if (isFirst) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
    
    switch (current) {
      case 0: return [1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 1: return [-1, 1, 2, 3, 5, 6, 7, 8];
      case 2: return [-2, -1, 1, 2, 5, 6, 7];
      case 3: return [-3, -2, -1, 1, 5, 6];
      case 4: return [-4, -3, -2, -1, 5];
      case 5: return [-5, 1, 2, 3, 4];
      case 6: return [-5, -1, 1, 2, 3];
      case 7: return [-5, -2, -1, 1, 2];
      case 8: return [-5, -3, -2, -1, 1];
      case 9: return [-5, -4, -3, -2, -1];
      default: return [];
    }
  }
  
  // ========== 1F：6〜9の加減算を自由に追加（1玉計算5未満）==========
  /**
   * クラス1F: 6〜9の加減算を自由に追加
   * - 使える数字: 0〜9
   * - 6〜9の使用条件:
   *   - 加算（+）も減算（-）も使える
   *   - どこでも自由に使える
   * - 演算: 加算（+）、減算（-）
   * - 1玉計算の制約: 1玉同士の計算が5以上にならない
   * - 答えの範囲: 0〜9
   */
  function getCandidates1F(current, isFirst) {
    if (isFirst) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
    
    switch (current) {
      case 0: return [1, 2, 3, 5, 6, 7, 8];
      case 1: return [-1, 1, 2, 3, 5, 6, 7, 8];
      case 2: return [-2, -1, 1, 2, 5, 6, 7];
      case 3: return [-3, -2, -1, 1, 5, 6];
      case 4: return [-3, -2, -1, 5];
      case 5: return [-5, 1, 2, 3];
      case 6: return [-6, -5, -1, 1, 2, 3];
      case 7: return [-7, -6, -5, -2, -1, 1, 2];
      case 8: return [-8, -7, -6, -5, -3, -2, -1, 1];
      case 9: return [-8, -7, -6, -5, -3, -2, -1];
      default: return [];
    }
  }
  
  // ========== 2A：繰り上がりOK、繰り下がりNG ==========
  /**
   * クラス2A: 1玉から5玉への繰り上がりOK
   * - 使える数字: 0〜9
   * - 演算: 加算（+）、減算（-）
   * - 新しく許可される操作:
   *   - 1玉から5玉への繰り上がりOK（例: 2+4=6）
   * - 禁止される操作:
   *   - 5玉から1玉への繰り下がりNG（例: 5-1、7-3）
   * - 必須条件: 問題の中に必ず1回以上の繰り上がりが含まれる
   * - 答えの範囲: 0〜9
   */
  function getCandidates2A(current, isFirst) {
    if (isFirst) {
      return [1, 2, 3, 4];
    }
    
    switch (current) {
      case 0: return [1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 1: return [-1, 1, 2, 3, 4, 5, 6, 7, 8];
      case 2: return [-2, -1, 1, 2, 3, 4, 5, 6, 7];
      case 3: return [-3, -2, -1, 1, 2, 3, 4, 5, 6];
      case 4: return [-4, -3, -2, -1, 1, 2, 3, 4, 5];
      case 5: return [-5, 1, 2, 3, 4];
      case 6: return [-6, -5, -1, 1, 2, 3];
      case 7: return [-7, -6, -5, -2, -1, 1, 2];
      case 8: return [-8, -7, -6, -5, -3, -2, -1, 1];
      case 9: return [-9, -8, -7, -6, -5, -4, -3, -2, -1];
      default: return [];
    }
  }
  
  // ========== 2B：繰り上がり・繰り下がり両方OK ==========
  /**
   * クラス2B: 繰り下がりもOK
   * - 使える数字: 0〜9
   * - 演算: 加算（+）、減算（-）
   * - 許可される操作:
   *   - 1玉から5玉への繰り上がりOK
   *   - 5玉から1玉への繰り下がりOK（例: 5-1=4、7-3=4）
   * - 必須条件: 問題の中に必ず1回以上の繰り上がりと1回以上の繰り下がりが含まれる
   * - 答えの範囲: 0〜9
   */
  function getCandidates2B(current, isFirst) {
    if (isFirst) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
    
    switch (current) {
      case 0: return [1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 1: return [-1, 1, 2, 3, 4, 5, 6, 7, 8];
      case 2: return [-2, -1, 1, 2, 3, 4, 5, 6, 7];
      case 3: return [-3, -2, -1, 1, 2, 3, 4, 5, 6];
      case 4: return [-4, -3, -2, -1, 1, 2, 3, 4, 5];
      case 5: return [-5, -4, -3, -2, -1, 1, 2, 3, 4];
      case 6: return [-6, -5, -4, -3, -2, -1, 1, 2, 3];
      case 7: return [-7, -6, -5, -4, -3, -2, -1, 1, 2];
      case 8: return [-8, -7, -6, -5, -4, -3, -2, -1, 1];
      case 9: return [-9, -8, -7, -6, -5, -4, -3, -2, -1];
      default: return [];
    }
  }
  
  // ========== 3A：10への繰り上がり必須、5への繰り上がり・5からの繰り下がりNG ==========
  /**
   * クラス3A: 10への繰り上がり必須
   * - 使える数字: 0〜9（2桁の計算、答えは0〜19）
   * - 演算: 加算（+）、減算（-）
   * - 必須条件: 1〜4の数を足したときに10に繰り上がる計算を必ず含む
   * - 禁止事項:
   *   - 5に繰り上がる問題（3+3など）を含んではいけない
   *   - 5から繰り下がる問題（7-3など）を含んではいけない
   *   - 10から繰り下がる計算を含んではいけない
   * - 答えの範囲: 0〜19
   */
  function getCandidates3A(current, isFirst) {
    if (isFirst) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
    
    switch (current) {
      case 0: return [1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 1: return [-1, 1, 2, 3, 5, 6, 7, 8, 9];
      case 2: return [-2, -1, 1, 2, 5, 6, 7, 8, 9];
      case 3: return [-3, -2, -1, 1, 5, 6, 7, 8, 9];
      case 4: return [-4, -3, -2, -1, 5, 6, 7, 8, 9];
      case 5: return [-5, 1, 2, 3, 4, 5];
      case 6: return [-6, -5, -1, 5, 7, 8, 9];
      case 7: return [-7, -6, -5, -2, -1, 5, 6, 8, 9];
      case 8: return [-8, -7, -6, -5, -3, -2, -1, 5, 6, 7, 9];
      case 9: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 5, 6, 7, 8];
      case 10: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 5, 6, 7, 8, 9];
      case 11: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 5, 6, 7, 8];
      case 12: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 5, 6, 7];
      case 13: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 5, 6];
      case 14: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 5];
      case 15: return [-9, -8, -7, -6, -5, -4, -3, -2, -1];
      case 16: return [-9, -8, -7, -6, -5, -4, -3, -2, -1];
      case 17: return [-9, -8, -7, -6, -5, -4, -3, -2, -1];
      case 18: return [-9, -8, -7, -6, -5, -4, -3, -2, -1];
      case 19: return [-9, -8, -7, -6, -5, -4, -3, -2, -1];
      default: return [];
    }
  }
  
  // ========== 3B：10への繰り上がり必須、5への繰り上がりOK、5からの繰り下がりNG ==========
  /**
   * クラス3B: 10への繰り上がり必須、5への繰り上がりOK
   * - 使える数字: 0〜9（2桁の計算、答えは0〜19）
   * - 演算: 加算（+）、減算（-）
   * - 必須条件: 1〜4の数を足したときに10に繰り上がる計算を必ず含む
   * - 許可事項:
   *   - 5に繰り上がる問題（3+3など）を含んでよい
   * - 禁止事項:
   *   - 5から繰り下がる問題（7-3など）を含んではいけない
   *   - 10から繰り下がる計算を含んではいけない
   * - 答えの範囲: 0〜19
   */
  function getCandidates3B(current, isFirst) {
    if (isFirst) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
    
    switch (current) {
      case 0: return [1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 1: return [-1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 2: return [-2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 3: return [-3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 4: return [-4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 5: return [-5, 1, 2, 3, 4, 6, 7, 8, 9];
      case 6: return [-6, -5, -1, 1, 2, 3, 5, 7, 8, 9];
      case 7: return [-7, -6, -5, -2, -1, 1, 2, 5, 6, 8, 9];
      case 8: return [-8, -7, -6, -5, -3, -2, -1, 1, 5, 6, 7, 9];
      case 9: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 5, 6, 7, 8];
      case 10: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 11: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 5, 6, 7, 8];
      case 12: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 5, 6, 7];
      case 13: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 5, 6];
      case 14: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 5];
      case 15: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4];
      case 16: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3];
      case 17: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2];
      case 18: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1];
      case 19: return [-9, -8, -7, -6, -5, -4, -3, -2, -1];
      default: return [];
    }
  }
  
  // ========== 3C：10からの繰り下がり必須、5への繰り上がり・5からの繰り下がりNG、10への繰り上がりNG ==========
  /**
   * クラス3C: 10からの繰り下がり必須
   * - 使える数字: 0〜9（2桁の計算、答えは0〜19）
   * - 演算: 加算（+）、減算（-）
   * - 必須条件: 1〜4の数を引いたときに10から繰り下がる計算を必ず含む
   * - 禁止事項:
   *   - 5に繰り上がる問題（3+3など）を含んではいけない
   *   - 5から繰り下がる問題（7-3など）を含んではいけない
   *   - 10へ繰り上がる計算を含んではいけない
   * - 答えの範囲: 0〜19
   */
  function getCandidates3C(current, isFirst) {
    if (isFirst) {
      return [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    }
    
    switch (current) {
      case 0: return [5, 6, 7, 8, 9];
      case 1: return [-1, 5, 6, 7, 8, 9];
      case 2: return [-2, -1, 5, 6, 7, 8, 9];
      case 3: return [-3, -2, -1, 5, 6, 7, 8, 9];
      case 4: return [-4, -3, -2, -1, 5, 6, 7, 8, 9];
      case 5: return [-5, 6, 7, 8, 9];
      case 6: return [-6, -5, -1, 5, 7, 8, 9];
      case 7: return [-7, -6, -5, -2, -1, 5, 6, 8, 9];
      case 8: return [-8, -7, -6, -5, -3, -2, -1, 5, 6, 7, 9];
      case 9: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 5, 6, 7, 8];
      case 10: return [-5, -6, -7, -8, -9];
      case 11: return [-1, -5, -6, -7, -8, -9];
      case 12: return [-2, -1, -5, -6, -7, -8, -9];
      case 13: return [-3, -2, -1, -5, -6, -7, -8, -9];
      case 14: return [-4, -3, -2, -1, -5, -6, -7, -8, -9];
      case 15: return [-5, -6, -7, -8, -9];
      case 16: return [-1, -5, -6, -7, -8, -9];
      case 17: return [-2, -1, -5, -6, -7, -8, -9];
      case 18: return [-3, -2, -1, -5, -6, -7, -8, -9];
      case 19: return [-4, -3, -2, -1, -5, -6, -7, -8, -9];
      default: return [];
    }
  }
  
  // ========== 3D：10からの繰り下がり必須、5への繰り上がりNG、5からの繰り下がりOK、10への繰り上がりNG ==========
  /**
   * クラス3D: 10からの繰り下がり必須、5からの繰り下がりOK
   * - 使える数字: 0〜9（2桁の計算、答えは0〜19）
   * - 演算: 加算（+）、減算（-）
   * - 必須条件: 1〜4の数を引いたときに10から繰り下がる計算を必ず含む
   * - 許可事項:
   *   - 5から繰り下がる問題（7-3など）を含んでよい
   * - 禁止事項:
   *   - 5に繰り上がる問題（3+3など）を含んではいけない
   *   - 10へ繰り上がる計算を含んではいけない
   * - 答えの範囲: 0〜19
   */
  function getCandidates3D(current, isFirst) {
    if (isFirst) {
      return [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    }
    
    switch (current) {
      case 0: return [5, 6, 7, 8, 9];
      case 1: return [-1, 5, 6, 7, 8, 9];
      case 2: return [-2, -1, 5, 6, 7, 8, 9];
      case 3: return [-3, -2, -1, 5, 6, 7, 8, 9];
      case 4: return [-4, -3, -2, -1, 5, 6, 7, 8, 9];
      case 5: return [-5, -4, -3, -2, -1, 6, 7, 8, 9];
      case 6: return [-6, -5, -4, -3, -2, -1, 5, 7, 8, 9];
      case 7: return [-7, -6, -5, -4, -3, -2, -1, 5, 6, 8, 9];
      case 8: return [-8, -7, -6, -5, -4, -3, -2, -1, 5, 6, 7, 9];
      case 9: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 5, 6, 7, 8];
      case 10: return [-5, -6, -7, -8, -9];
      case 11: return [-1, -5, -6, -7, -8, -9];
      case 12: return [-2, -1, -5, -6, -7, -8, -9];
      case 13: return [-3, -2, -1, -5, -6, -7, -8, -9];
      case 14: return [-4, -3, -2, -1, -5, -6, -7, -8, -9];
      case 15: return [-5, -4, -3, -2, -1, -6, -7, -8, -9];
      case 16: return [-6, -5, -4, -3, -2, -1, -7, -8, -9];
      case 17: return [-7, -6, -5, -4, -3, -2, -1, -8, -9];
      case 18: return [-8, -7, -6, -5, -4, -3, -2, -1, -9];
      case 19: return [-9, -8, -7, -6, -5, -4, -3, -2, -1];
      default: return [];
    }
  }
  
  // ========== 3E：10からの繰り下がり必須、すべてOK ==========
  /**
   * クラス3E: 10からの繰り下がり必須、すべてOK
   * - 使える数字: 0〜9（2桁の計算、答えは0〜19）
   * - 演算: 加算（+）、減算（-）
   * - 必須条件: 1〜4の数を引いたときに10から繰り下がる計算を必ず含む
   * - 許可事項:
   *   - 5に繰り上がる問題（3+3など）を含んでよい
   *   - 5から繰り下がる問題（7-3など）を含んでよい
   *   - 10へ繰り上がる計算を含んでよい
   * - 答えの範囲: 0〜19
   */
  function getCandidates3E(current, isFirst) {
    if (isFirst) {
      return [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    }
    
    switch (current) {
      case 0: return [1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 1: return [-1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 2: return [-2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 3: return [-3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 4: return [-4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 5: return [-5, -4, -3, -2, -1, 1, 2, 3, 4, 6, 7, 8, 9];
      case 6: return [-6, -5, -4, -3, -2, -1, 1, 2, 3, 5, 7, 8, 9];
      case 7: return [-7, -6, -5, -4, -3, -2, -1, 1, 2, 5, 6, 8, 9];
      case 8: return [-8, -7, -6, -5, -4, -3, -2, -1, 1, 5, 6, 7, 9];
      case 9: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 5, 6, 7, 8];
      case 10: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      case 11: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 5, 6, 7, 8];
      case 12: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 5, 6, 7];
      case 13: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 5, 6];
      case 14: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 5];
      case 15: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4];
      case 16: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3];
      case 17: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2];
      case 18: return [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1];
      case 19: return [-9, -8, -7, -6, -5, -4, -3, -2, -1];
      default: return [];
    }
  }
  
  // ========== ユーティリティ関数 ==========
  
  /**
   * 数値から1玉の個数を取得
   */
  function get1Bead(num) {
    return num % 5;
  }
  
  /**
   * 数値から10の位の値を取得
   */
  function get10Bead(num) {
    return Math.floor(num / 10);
  }
  
  /**
   * 問題の検証
   */
  function validateProblem(result, classType) {
    const { numbers } = result;
    
    // 2A: 5への繰り上がり必須
    if (classType === '2A') {
      let hasKuriagari = false;
      let current = 0;
      for (let num of numbers) {
        const currentIchidama = get1Bead(current);
        const numIchidama = get1Bead(Math.abs(num));
        if (num > 0 && currentIchidama + numIchidama >= 5) {
          hasKuriagari = true;
          break;
        }
        current += num;
      }
      if (!hasKuriagari) return false;
    }
    
    // 2B: 5への繰り上がり・5からの繰り下がり必須
    if (classType === '2B') {
      let hasKuriagari = false;
      let hasKurisagari = false;
      let current = 0;
      for (let num of numbers) {
        const currentIchidama = get1Bead(current);
        const numIchidama = get1Bead(Math.abs(num));
        if (num > 0 && currentIchidama + numIchidama >= 5) hasKuriagari = true;
        if (num < 0 && currentIchidama < numIchidama) hasKurisagari = true;
        current += num;
      }
      if (!hasKuriagari || !hasKurisagari) return false;
    }
    
    // 3A: 10への繰り上がり必須、5への繰り上がり・5からの繰り下がりNG
    if (classType === '3A') {
      let has10Kuriagari = false;
      let current = 0;
      for (let num of numbers) {
        const currentIchidama = get1Bead(current);
        const numIchidama = get1Bead(Math.abs(num));
        
        // 5への繰り上がりチェック（NG）
        if (num > 0 && num >= 1 && num <= 4 && currentIchidama + numIchidama >= 5 && current < 10) {
          return false;
        }
        // 5からの繰り下がりチェック（NG）
        if (num < 0 && num >= -4 && num <= -1 && currentIchidama < numIchidama && current < 10) {
          return false;
        }
        
        // 10への繰り上がりチェック
        if (current < 10 && current + num >= 10) {
          has10Kuriagari = true;
        }
        current += num;
      }
      if (!has10Kuriagari) return false;
    }
    
    // 3B: 10への繰り上がり必須、5からの繰り下がりNG
    if (classType === '3B') {
      let has10Kuriagari = false;
      let current = 0;
      for (let num of numbers) {
        const currentIchidama = get1Bead(current);
        const numIchidama = get1Bead(Math.abs(num));
        
        // 5からの繰り下がりチェック（NG）
        if (num < 0 && num >= -4 && num <= -1 && currentIchidama < numIchidama && current < 10) {
          return false;
        }
        
        // 10への繰り上がりチェック
        if (current < 10 && current + num >= 10) {
          has10Kuriagari = true;
        }
        current += num;
      }
      if (!has10Kuriagari) return false;
    }
    
    // 3C: 10からの繰り下がり必須、5への繰り上がり・5からの繰り下がり・10への繰り上がりNG
    if (classType === '3C') {
      let has10Kurisagari = false;
      let current = 0;
      for (let num of numbers) {
        const currentIchidama = get1Bead(current);
        const numIchidama = get1Bead(Math.abs(num));
        
        // 5への繰り上がりチェック（NG）
        if (num > 0 && num >= 1 && num <= 4 && currentIchidama + numIchidama >= 5 && current < 10) {
          return false;
        }
        // 5からの繰り下がりチェック（NG）
        if (num < 0 && num >= -4 && num <= -1 && currentIchidama < numIchidama && current < 10) {
          return false;
        }
        // 10への繰り上がりチェック（NG）
        if (current < 10 && current + num >= 10) {
          return false;
        }
        
        // 10からの繰り下がりチェック
        if (current >= 10 && current + num < 10) {
          has10Kurisagari = true;
        }
        current += num;
      }
      if (!has10Kurisagari) return false;
    }
    
    // 3D: 10からの繰り下がり必須、5への繰り上がり・10への繰り上がりNG
    if (classType === '3D') {
      let has10Kurisagari = false;
      let current = 0;
      for (let num of numbers) {
        const currentIchidama = get1Bead(current);
        const numIchidama = get1Bead(Math.abs(num));
        
        // 5への繰り上がりチェック（NG）
        if (num > 0 && num >= 1 && num <= 4 && currentIchidama + numIchidama >= 5 && current < 10) {
          return false;
        }
        // 10への繰り上がりチェック（NG）
        if (current < 10 && current + num >= 10) {
          return false;
        }
        
        // 10からの繰り下がりチェック
        if (current >= 10 && current + num < 10) {
          has10Kurisagari = true;
        }
        current += num;
      }
      if (!has10Kurisagari) return false;
    }
    
    // 3E: 10からの繰り下がり必須
    if (classType === '3E') {
      let has10Kurisagari = false;
      let current = 0;
      for (let num of numbers) {
        // 10からの繰り下がりチェック
        if (current >= 10 && current + num < 10) {
          has10Kurisagari = true;
        }
        current += num;
      }
      if (!has10Kurisagari) return false;
    }
    
    return true;
  }
