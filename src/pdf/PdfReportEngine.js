export class PdfReportEngine {
  constructor({ title = 'Druckverlust Pro' } = {}) {
    this.title = title;
  }

  createReportModel(project, calculation) {
    return {
      title: this.title,
      project: project.project || project,
      sections: project.sections || project.rows || [],
      formParts: project.formParts || project.parts || [],
      totals: calculation?.totals || { duct: 0, formParts: 0, special: 0, total: 0 },
      generatedAt: new Date().toISOString()
    };
  }
}

export default PdfReportEngine;
