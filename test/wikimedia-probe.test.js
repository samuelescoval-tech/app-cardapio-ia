const test = require("node:test");
const assert = require("node:assert/strict");
const { licencaPermitida, normalizarCandidato } = require("../scripts/benchmark-wikimedia-relevance");

test("sonda Commons preserva somente a politica visual atual", () => {
  assert.equal(licencaPermitida("CC0"), true);
  assert.equal(licencaPermitida("Public domain"), true);
  assert.equal(licencaPermitida("CC BY 4.0"), true);
  assert.equal(licencaPermitida("CC BY-SA 4.0"), false);
  assert.equal(licencaPermitida("CC BY-NC 3.0"), false);
});

test("sonda Commons exige miniatura e pagina original", () => {
  const candidato = normalizarCandidato({
    title: "File:Bolo.jpg",
    imageinfo: [{
      thumburl: "https://upload.wikimedia.org/bolo.jpg",
      descriptionurl: "https://commons.wikimedia.org/wiki/File:Bolo.jpg",
      mime: "image/jpeg",
      extmetadata: { LicenseShortName: { value: "CC BY 4.0" } }
    }]
  });

  assert.equal(candidato.title, "Bolo.jpg");
  assert.equal(candidato.allowed, true);
  assert.equal(normalizarCandidato({ title: "File:Sem URL" }), null);
  assert.equal(normalizarCandidato({
    title: "File:Video.ogv",
    imageinfo: [{ thumburl: "https://example.com/frame.jpg", descriptionurl: "https://example.com/video", mime: "video/ogg", extmetadata: {} }]
  }), null);
});
