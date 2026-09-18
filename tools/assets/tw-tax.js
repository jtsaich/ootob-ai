/*
 * tw-tax.js — 台灣接案扣繳與稅額計算（115 年度／2026）
 * 單一事實來源：所有 /tools/ 的單據都用這裡的參數與函式，不各自寫死數字。
 * 年度更新只改 PARAMS。
 */
(function (root) {
  "use strict";

  var PARAMS = {
    year: 115,
    minWage: 29500,            // 115 年基本工資（月）＝補充保費薪資門檻
    salaryThreshold: 90501,    // 居住者薪資扣繳起扣標準
    salaryRate: 0.05,
    profThreshold: 20010,      // 9A/9B 起扣標準（扣繳稅額 2,000 元以下免扣）
    profRate: 0.10,
    suppRate: 0.0211,          // 二代健保補充保費
    suppProfMin: 20000,        // 執行業務／稿費 單次給付門檻
    nrRate: 0.20,              // 非居住者一般扣繳率
    nrSalaryLow: 0.06,
    nrSalaryHigh: 0.18,
    nrSalaryBreak: 44250,      // 基本工資 1.5 倍
    nrExemptRoyalty: 5000,     // 非居住者稿費免扣繳上限
    businessTaxRate: 0.05      // 營業稅（開發票時外加）
  };
  Object.freeze(PARAMS);

  var CATEGORY_NAME = {
    "9B": "9B 稿費",
    "9A": "9A 執行業務所得",
    "50": "50 薪資所得",
    "92": "92 其他所得"
  };

  function fmt(n) { return (Math.round(n) || 0).toLocaleString("en-US"); }
  function pct(r) { return r ? (Math.round(r * 10000) / 100) + "%" : "0%"; }

  /**
   * 代扣所得稅與二代健保補充保費。
   * @param {number} gross 給付總額
   * @param {"9A"|"9B"|"50"|"92"} category 所得類別
   * @param {"local"|"foreign183"|"foreignUnder183"} residency 身分別
   * @param {"normal"|"union"|"none"} nhi 補充保費身分
   * @returns {{gross:number,tax:number,taxRate:number,supp:number,net:number,taxNote:string,suppNote:string}}
   */
  function withhold(gross, category, residency, nhi) {
    var P = PARAMS;
    var g = Math.max(0, Math.floor(gross || 0));
    var nonResident = residency === "foreignUnder183";
    var tax = 0, rate = 0, taxNote = "", supp = 0, suppNote = "";

    if (nonResident) {
      if (category === "50") {
        rate = g > P.nrSalaryBreak ? P.nrSalaryHigh : P.nrSalaryLow;
        tax = Math.floor(g * rate);
        taxNote = "非居住者薪資：" + fmt(P.nrSalaryBreak) + " 元以下扣 6%，超過扣 18%。";
      } else if (category === "9B") {
        if (g > P.nrExemptRoyalty) { rate = P.nrRate; tax = Math.floor(g * rate); }
        taxNote = "非居住者稿費：每次給付 " + fmt(P.nrExemptRoyalty) + " 元以下免扣繳，超過全額扣 20%。";
      } else {
        rate = P.nrRate;
        tax = Math.floor(g * rate);
        taxNote = "非居住者" + (category === "9A" ? "執行業務所得" : "其他所得") + "：全額扣 20%。";
      }
      taxNote += "應於給付日起 10 日內申報扣繳。";
    } else if (category === "50") {
      if (g >= P.salaryThreshold) { rate = P.salaryRate; tax = Math.floor(g * rate); }
      taxNote = "居住者薪資：單次給付達 " + fmt(P.salaryThreshold) + " 元按 5% 扣繳，未達免扣繳。";
    } else if (category === "9A" || category === "9B") {
      if (g >= P.profThreshold) { rate = P.profRate; tax = Math.floor(g * rate); }
      taxNote = "居住者" + (category === "9A" ? "執行業務所得" : "稿費") + "：單次給付達 " + fmt(P.profThreshold) + " 元按 10% 扣繳（扣繳稅額 2,000 元以下免扣繳）。";
    } else {
      taxNote = "其他所得免予扣繳所得稅，給付單位仍應列單申報。";
    }

    if (category === "92") {
      suppNote = "其他所得不列入補充保費計算。";
    } else if (nhi !== "normal") {
      suppNote = nhi === "union"
        ? "所得人已加職業工會並附加保證明，本筆不扣補充保費。"
        : "所得人非健保被保險人，本筆不扣補充保費。";
    } else {
      var min = category === "50" ? PARAMS.minWage : PARAMS.suppProfMin;
      if (g >= min) { supp = Math.round(g * PARAMS.suppRate); }
      suppNote = (category === "50" ? "兼職薪資" : "執行業務所得") + "單次給付達 " + fmt(min) + " 元，扣 2.11% 補充保費。";
    }

    return { gross: g, tax: tax, taxRate: rate, supp: supp, net: g - tax - supp, taxNote: taxNote, suppNote: suppNote };
  }

  /**
   * 反推：想實拿 target 淨額，對公司戶要報多少。
   * 扣繳有階梯與四捨五入，直接除費率會差幾十元，所以先估再逐元校正。
   * @returns {{gross:number, result:object}} gross 為最小可讓 net >= target 的給付額
   */
  function grossUpForNet(target, category, residency, nhi) {
    var t = Math.max(0, Math.ceil(target || 0));
    if (!t) return { gross: 0, result: withhold(0, category, residency, nhi) };
    var guess = Math.max(t, Math.floor(t / 0.8)); // 最重的情況約扣 20%+2.11%
    var lo = t, hi = guess;
    while (withhold(hi, category, residency, nhi).net < t) { hi = Math.ceil(hi * 1.2) + 1; }
    while (lo < hi) {
      var mid = Math.floor((lo + hi) / 2);
      if (withhold(mid, category, residency, nhi).net >= t) { hi = mid; } else { lo = mid + 1; }
    }
    return { gross: lo, result: withhold(lo, category, residency, nhi) };
  }

  /** 營業稅：mode = exclusive（未稅外加 5%）／inclusive（含稅內含）／none（免稅或個人無發票） */
  function businessTax(subtotal, mode) {
    var s = Math.max(0, Math.round(subtotal || 0));
    if (mode === "exclusive") {
      var t = Math.round(s * PARAMS.businessTaxRate);
      return { base: s, tax: t, total: s + t };
    }
    if (mode === "inclusive") {
      var base = Math.round(s / (1 + PARAMS.businessTaxRate));
      return { base: base, tax: s - base, total: s };
    }
    return { base: s, tax: 0, total: s };
  }

  root.TWTax = {
    PARAMS: PARAMS,
    CATEGORY_NAME: CATEGORY_NAME,
    withhold: withhold,
    grossUpForNet: grossUpForNet,
    businessTax: businessTax,
    fmt: fmt,
    pct: pct
  };
})(window);
