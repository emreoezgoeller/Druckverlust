import {
    createProject,
    createSection,
    createFormPart,
    createSpecialComponent
} from "./ProjectModel.js";

export default class ProjectEngine {

    constructor(project = null) {
        this.project = project ?? createProject();
    }

    getProject() {
        return this.project;
    }

    getSystem(id = null) {

        if (!id)
            return this.project.systems[0];

        return this.project.systems.find(s => s.id === id);
    }

    addSection(systemId, sectionData = {}) {

        const system = this.getSystem(systemId);

        if (!system)
            throw new Error("System nicht gefunden.");

        const section = createSection(sectionData);

        system.sections.push(section);

        return section;
    }

    addFormPart(systemId, formPartData = {}) {

        const system = this.getSystem(systemId);

        if (!system)
            throw new Error("System nicht gefunden.");

        const part = createFormPart(formPartData);

        system.formParts.push(part);

        return part;
    }

    addSpecialComponent(systemId, data = {}) {

        const system = this.getSystem(systemId);

        if (!system)
            throw new Error("System nicht gefunden.");

        const special = createSpecialComponent(data);

        system.specialComponents.push(special);

        return special;
    }

    removeSection(systemId, sectionId) {

        const system = this.getSystem(systemId);

        system.sections =
            system.sections.filter(s => s.id !== sectionId);
    }

    removeFormPart(systemId, partId) {

        const system = this.getSystem(systemId);

        system.formParts =
            system.formParts.filter(p => p.id !== partId);
    }

    removeSpecialComponent(systemId, specialId) {

        const system = this.getSystem(systemId);

        system.specialComponents =
            system.specialComponents.filter(s => s.id !== specialId);
    }

}